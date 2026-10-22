import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import sharp from 'sharp'; // ✅ أضفنا هذه المكتبة للضغط

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Upload API called');
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'legal-pages';

    if (!file) {
      console.error('❌ No file uploaded');
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('📁 File received:', file.name, 'Size:', file.size, 'Type:', file.type);

    // التحقق من نوع الملف (كما كان في كودك الأصلي)
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'File type not allowed. Please upload an image.' },
        { status: 400 }
      );
    }

    // التحقق من حجم الملف (الحد الأقصى 5 ميجابايت)
    if (file.size > 5 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Max 5MB allowed.' },
        { status: 400 }
      );
    }

    // تحويل الملف إلى Buffer لمعالجته
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // ✅ الضغط والتحويل إلى WebP
    // ملاحظة: ملفات SVG لا يمكن ضغطها بـ sharp، لذلك نتركها كما هي
    let finalBuffer = buffer;
    let extension = '.webp';

    if (file.type !== 'image/svg+xml') {
      finalBuffer = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true }) // الحد الأقصى للعرض 1200 بكسل
        .webp({ quality: 80 }) // تحويل إلى WebP
        .toBuffer();
    } else {
      extension = path.extname(file.name); // نحتفظ بامتداد الـ SVG
    }

    // إنشاء اسم فريد للملف
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    // إذا تحول إلى webp نغير الامتداد، وإلا نستخدم الاسم الأصلي
    const baseName = path.parse(cleanName).name;
    const filename = `${type}_${timestamp}_${baseName}${extension}`;
    
    // حفظ الملف في مجلد public/uploads/{type}/
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', type);
    await mkdir(uploadDir, { recursive: true });
    
    const filePath = path.join(uploadDir, filename);
    await writeFile(filePath, finalBuffer);

    console.log('✅ File saved and optimized:', filePath);

    // إرجاع رابط الصورة
    const imageUrl = `/uploads/${type}/${filename}`;
    
    return NextResponse.json({
      url: imageUrl,
    });

  } catch (error) {
    console.error('❌ Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
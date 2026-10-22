import { NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import path from 'path';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
    }

    // ✅ إصلاح المسار: إزالة الرموز المشفرة مثل %20 وتحويلها لمسافات عادية
    const decodedUrl = decodeURIComponent(imageUrl);
    
    // إزالة علامة السلاش الأولى إذا كانت موجودة لتجنب مشاكل المسار
    const cleanPath = decodedUrl.startsWith('/') ? decodedUrl.slice(1) : decodedUrl;

    // بناء المسار الفعلي للملف
    const filePath = path.join(process.cwd(), 'public', cleanPath);

    console.log('Attempting to delete file at:', filePath);

    // حذف الملف
    await unlink(filePath);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    
    // إذا كان الملف غير موجود، نعتبر العملية ناجحة (لتنظيف الواجهة)
    if (error.code === 'ENOENT') {
      return NextResponse.json({ success: true, message: 'File already deleted' });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete image' }, 
      { status: 500 }
    );
  }
}
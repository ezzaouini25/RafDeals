import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import path from 'path';
import sharp from 'sharp';

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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { error: 'File type not allowed. Please upload an image.' },
        { status: 400 }
      );
    }

    // Validate file size (4 MB — safe under Vercel's 4.5 MB function limit)
    if (file.size > 4 * 1024 * 1024) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json(
        { error: 'File too large. Max 4MB allowed.' },
        { status: 400 }
      );
    }

    // Convert to buffer for processing
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Compress and convert to WebP (SVGs are passed through unchanged)
    let finalBuffer = buffer;
    let extension = '.webp';

    if (file.type !== 'image/svg+xml') {
      finalBuffer = await sharp(buffer)
        .resize({ width: 1200, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    } else {
      extension = path.extname(file.name);
    }

    // Build a unique filename
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const baseName = path.parse(cleanName).name;
    const filename = `${type}_${timestamp}_${baseName}${extension}`;

    // ✅ Upload to Vercel Blob
    const blob = await put(`uploads/${type}/${filename}`, finalBuffer, {
      access: 'public',
      addRandomSuffix: false,
      contentType: file.type === 'image/svg+xml' ? 'image/svg+xml' : 'image/webp',
    });

    console.log('✅ File uploaded to Blob:', blob.url);

    // ✅ Return a local-looking path so existing DB rows and components stay unchanged.
    // The rewrite in next.config.js maps /uploads/... to the Blob host.
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
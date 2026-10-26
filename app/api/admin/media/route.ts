import { NextRequest, NextResponse } from 'next/server';
import { list } from '@vercel/blob';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const folder = searchParams.get('folder') || 'articles';

    // ✅ List blobs under uploads/{folder}/
    const { blobs } = await list({
      prefix: `uploads/${folder}/`,
      limit: 1000,
    });

    // Filter to images, build local-looking paths, newest first
    const images = blobs
      .filter(b => /\.(jpg|jpeg|png|webp|gif)$/i.test(b.pathname))
      .sort((a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime())
      .map(b => {
        // b.pathname is like "uploads/articles/offer_123.webp"
        // Strip the leading "uploads/" so we can reconstruct /uploads/...
        return `/${b.pathname}`;
      });

    return NextResponse.json({ images });
  } catch (error) {
    console.error('Error listing images:', error);
    return NextResponse.json({ images: [] });
  }
}
import { NextResponse } from 'next/server';
import { del } from '@vercel/blob';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided' }, { status: 400 });
    }

    // Decode URL-encoded characters (e.g. %20 → space)
    const decodedUrl = decodeURIComponent(imageUrl);

    // Reconstruct the Blob URL from the local-looking path.
    // DB stores "/uploads/..."; Blob URL is https://{storeHost}/uploads/...
    const storeHost = process.env.BLOB_STORE_HOST;
    if (!storeHost) {
      console.warn('⚠️ BLOB_STORE_HOST not set, skipping delete');
      return NextResponse.json({ success: true, message: 'File skip (no store host)' });
    }

    const cleanPath = decodedUrl.startsWith('/') ? decodedUrl : `/${decodedUrl}`;
    const blobUrl = `https://${storeHost}${cleanPath}`;

    console.log('Attempting to delete blob at:', blobUrl);

    // ✅ Delete from Vercel Blob
    await del(blobUrl);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Delete error:', error);

    // If the blob is already gone, treat as success for UI cleanup
    if (error?.message?.toLowerCase().includes('not found') || error?.status === 404) {
      return NextResponse.json({ success: true, message: 'File already deleted' });
    }

    return NextResponse.json(
      { error: error.message || 'Failed to delete image' },
      { status: 500 }
    );
  }
}
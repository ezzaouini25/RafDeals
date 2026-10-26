import { del } from '@vercel/blob';
import path from 'path';

// Delete image from Vercel Blob
export async function deleteImage(imagePath: string) {
  if (!imagePath) return;

  try {
    // imagePath stored in DB is a local-looking path like "/uploads/offers/x.webp".
    // The actual Blob URL is stored on Vercel, so we reconstruct it from the
    // store hostname + pathname.
    const storeHost = process.env.BLOB_STORE_HOST;
    if (!storeHost) {
      console.warn('⚠️ BLOB_STORE_HOST not set, skipping delete');
      return;
    }

    // Normalize: ensure leading slash so concatenation is clean
    const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
    const blobUrl = `https://${storeHost}${cleanPath}`;

    await del(blobUrl);
    console.log(`✅ Deleted blob: ${blobUrl}`);
  } catch (error) {
    // Don't throw if the blob doesn't exist or was already deleted
    console.warn(`⚠️ Could not delete blob: ${imagePath}`, error);
  }
}

// Generate slug from title (unchanged)
export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
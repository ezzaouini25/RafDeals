import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { list, del } from '@vercel/blob';

export async function POST() {
  try {
    const folder = 'legal-pages';

    // ✅ List all blobs under uploads/legal-pages/
    const { blobs } = await list({
      prefix: `uploads/${folder}/`,
      limit: 1000,
    });

    // Only consider image files
    const imageBlobs = blobs.filter(b =>
      /\.(jpg|jpeg|png|webp|gif)$/i.test(b.pathname)
    );

    // Get all legal page content from DB
    const [rows] = await pool.execute('SELECT content FROM legal_pages');
    const allContent = (rows as any[]).map(row => row.content).join(' ');

    // Extract image URLs from content
    const usedImages: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(allContent)) !== null) {
      usedImages.push(match[1]);
    }

    // Find orphaned blobs: pathname not referenced in any page
    const orphanedBlobs = imageBlobs.filter(blob => {
      const localPath = `/${blob.pathname}`; // "/uploads/legal-pages/x.webp"
      return !usedImages.includes(localPath);
    });

    // Delete orphaned blobs
    let deletedCount = 0;
    for (const blob of orphanedBlobs) {
      try {
        // blob.url is the full https://...blob... URL — del() accepts it directly
        await del(blob.url);
        deletedCount++;
        console.log(`✅ Deleted orphan: ${blob.pathname}`);
      } catch (error) {
        console.warn(`⚠️ Could not delete: ${blob.pathname}`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalFiles: imageBlobs.length,
      orphanedFiles: orphanedBlobs.length,
      deleted: deletedCount,
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup images' },
      { status: 500 }
    );
  }
}
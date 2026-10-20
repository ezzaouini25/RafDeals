import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { readdir, unlink, stat } from 'fs/promises';
import path from 'path';

export async function POST() {
  try {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'legal-pages');
    
    // Get all images in the upload folder
    const files = await readdir(uploadDir);
    
    // Get all image URLs from the database
    const [rows] = await pool.execute('SELECT content FROM legal_pages');
    const allContent = (rows as any[]).map(row => row.content).join(' ');
    
    // Extract all image URLs from content
    const usedImages: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(allContent)) !== null) {
      usedImages.push(match[1]);
    }

    // Find orphaned images (files not referenced in any page)
    const orphanedFiles: string[] = [];
    for (const file of files) {
      const filePath = `/uploads/legal-pages/${file}`;
      if (!usedImages.includes(filePath)) {
        orphanedFiles.push(filePath);
      }
    }

    // Delete orphaned images
    let deletedCount = 0;
    for (const filePath of orphanedFiles) {
      try {
        const fullPath = path.join(process.cwd(), 'public', filePath);
        await unlink(fullPath);
        deletedCount++;
      } catch (error) {
        console.warn(`⚠️ Could not delete: ${filePath}`, error);
      }
    }

    return NextResponse.json({
      success: true,
      totalFiles: files.length,
      orphanedFiles: orphanedFiles.length,
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
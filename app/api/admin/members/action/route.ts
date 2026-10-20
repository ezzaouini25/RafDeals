import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { unlink } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: 'ID and action are required' },
        { status: 400 }
      );
    }

    // ✅ For delete, get the image_path first
    if (action === 'delete') {
      // STEP 1: Get the image_path before deleting
      const [rows] = await pool.execute(
        'SELECT image_path FROM comments_testimonials WHERE id = ?',
        [id]
      );

      const items = rows as any[];
      let imagePath = null;
      if (items.length > 0) {
        imagePath = items[0].image_path;
      }

      // STEP 2: Delete from database
      await pool.execute('DELETE FROM comments_testimonials WHERE id = ?', [id]);

      // STEP 3: Delete image from filesystem
      if (imagePath) {
        try {
          const filePath = path.join(process.cwd(), 'public', imagePath);
          await unlink(filePath);
          console.log(`✅ Deleted image: ${filePath}`);
        } catch (error) {
          // File might not exist, log but don't fail
          console.warn(`⚠️ Could not delete image: ${imagePath}`, error);
        }
      }

      return NextResponse.json({
        success: true,
        message: imagePath ? 'Item and image deleted successfully' : 'Item deleted successfully',
      });
    }

    // ✅ Approve
    if (action === 'approve') {
      await pool.execute(
        'UPDATE comments_testimonials SET is_approved = 1 WHERE id = ?',
        [id]
      );
      return NextResponse.json({ success: true });
    }

    // ✅ Disapprove
    if (action === 'disapprove') {
      await pool.execute(
        'UPDATE comments_testimonials SET is_approved = 0 WHERE id = ?',
        [id]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Error performing action:', error);
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    );
  }
}
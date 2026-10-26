import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { del } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const { id, action } = await request.json();

    if (!id || !action) {
      return NextResponse.json(
        { error: 'ID and action are required' },
        { status: 400 }
      );
    }

    if (action === 'delete') {
      const [rows] = await pool.execute(
        'SELECT image_path FROM comments_testimonials WHERE id = ?',
        [id]
      );

      const items = rows as any[];
      let imagePath = null;
      if (items.length > 0) {
        imagePath = items[0].image_path;
      }

      await pool.execute('DELETE FROM comments_testimonials WHERE id = ?', [id]);

      if (imagePath) {
        const storeHost = process.env.BLOB_STORE_HOST;
        if (storeHost) {
          try {
            const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
            const blobUrl = `https://${storeHost}${cleanPath}`;
            await del(blobUrl);
            console.log(`✅ Deleted blob: ${blobUrl}`);
          } catch (error) {
            console.warn(`⚠️ Could not delete blob: ${imagePath}`, error);
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: imagePath ? 'Item and image deleted successfully' : 'Item deleted successfully',
      });
    }

    if (action === 'approve') {
      await pool.execute(
        'UPDATE comments_testimonials SET is_approved = 1 WHERE id = ?',
        [id]
      );
      return NextResponse.json({ success: true });
    }

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
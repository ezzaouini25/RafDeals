import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { del } from '@vercel/blob';

// ✅ GET - Fetch all testimonials
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE type = 'testimonial'";
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (author_name LIKE ? OR author_email LIKE ? OR content LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const [items] = await pool.execute(
      `SELECT 
        id, type, author_name, gender, author_email, occupation,
        payout_amount, payout_type, image_path, content, rating,
        article_id, offer_id, is_approved, is_read, created_at
      FROM comments_testimonials
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [...params, limit, offset]
    );

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM comments_testimonials ${whereClause}`,
      params
    );

    return NextResponse.json({
      items,
      total: (totalResult as any[])[0]?.total || 0,
      totalPages: Math.ceil(((totalResult as any[])[0]?.total || 0) / limit),
      page,
    });

  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return NextResponse.json(
      { error: 'Failed to fetch testimonials' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Delete testimonial and its image
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Testimonial ID is required' },
        { status: 400 }
      );
    }

    // STEP 1: Get the testimonial data before deleting
    const [rows] = await pool.execute(
      'SELECT image_path FROM comments_testimonials WHERE id = ? AND type = "testimonial"',
      [id]
    );

    const testimonials = rows as any[];
    if (testimonials.length === 0) {
      return NextResponse.json(
        { error: 'Testimonial not found' },
        { status: 404 }
      );
    }

    const testimonial = testimonials[0];
    const imagePath = testimonial.image_path;

    // STEP 2: Delete the testimonial from database
    await pool.execute('DELETE FROM comments_testimonials WHERE id = ?', [id]);

    // STEP 3: Delete the image from Vercel Blob
    let imageDeleted = false;
    if (imagePath) {
      const storeHost = process.env.BLOB_STORE_HOST;
      if (storeHost) {
        try {
          const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
          const blobUrl = `https://${storeHost}${cleanPath}`;
          await del(blobUrl);
          imageDeleted = true;
          console.log(`✅ Deleted testimonial blob: ${blobUrl}`);
        } catch (error) {
          console.warn(`⚠️ Could not delete blob: ${imagePath}`, error);
        }
      } else {
        console.warn('⚠️ BLOB_STORE_HOST not set, skipping blob delete');
      }
    }

    return NextResponse.json({
      success: true,
      message: imagePath ? 'Testimonial and image deleted successfully' : 'Testimonial deleted successfully',
      imageDeleted,
    });

  } catch (error) {
    console.error('Error deleting testimonial:', error);
    return NextResponse.json(
      { error: 'Failed to delete testimonial' },
      { status: 500 }
    );
  }
}
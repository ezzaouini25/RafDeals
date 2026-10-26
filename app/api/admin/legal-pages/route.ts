import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { del } from '@vercel/blob';

// ✅ GET - Fetch all legal pages
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR slug LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const [pages] = await pool.execute(
      `SELECT id, title, slug, content, is_published, updated_at
       FROM legal_pages
       ${whereClause}
       ORDER BY updated_at DESC`,
      params
    );

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM legal_pages ${whereClause}`,
      params
    );

    return NextResponse.json({
      pages,
      total: (totalResult as any[])[0]?.total || 0,
    });
  } catch (error) {
    console.error('Error fetching legal pages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch legal pages' },
      { status: 500 }
    );
  }
}

// ✅ POST - Create new legal page
export async function POST(request: NextRequest) {
  try {
    const { title, slug, content, is_published } = await request.json();

    // Check if slug already exists
    const [existing] = await pool.execute(
      'SELECT id FROM legal_pages WHERE slug = ?',
      [slug]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO legal_pages (title, slug, content, is_published)
       VALUES (?, ?, ?, ?)`,
      [title, slug, content, is_published !== false ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
    });
  } catch (error) {
    console.error('Error creating legal page:', error);
    return NextResponse.json(
      { error: 'Failed to create legal page' },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update legal page
export async function PUT(request: NextRequest) {
  try {
    const { id, title, slug, content, is_published } = await request.json();

    // Check if slug already exists for another page
    const [existing] = await pool.execute(
      'SELECT id FROM legal_pages WHERE slug = ? AND id != ?',
      [slug, id]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    await pool.execute(
      `UPDATE legal_pages 
       SET title = ?, slug = ?, content = ?, is_published = ?
       WHERE id = ?`,
      [title, slug, content, is_published !== false ? 1 : 0, id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating legal page:', error);
    return NextResponse.json(
      { error: 'Failed to update legal page' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Delete legal page and its images
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Page ID is required' },
        { status: 400 }
      );
    }

    // STEP 1: Get the page content before deleting
    const [rows] = await pool.execute(
      'SELECT content FROM legal_pages WHERE id = ?',
      [id]
    );

    const pages = rows as any[];
    if (pages.length === 0) {
      return NextResponse.json(
        { error: 'Page not found' },
        { status: 404 }
      );
    }

    const page = pages[0];
    const content = page.content || '';

    // STEP 2: Extract image URLs from content
    const imageUrls: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      if (src.startsWith('/uploads/legal-pages/')) {
        imageUrls.push(src);
      }
    }

    // STEP 3: Delete the page from database
    await pool.execute('DELETE FROM legal_pages WHERE id = ?', [id]);

    // STEP 4: Delete the images from Vercel Blob
    const deletedImages: string[] = [];
    const storeHost = process.env.BLOB_STORE_HOST;

    if (storeHost) {
      for (const url of imageUrls) {
        try {
          const cleanPath = url.startsWith('/') ? url : `/${url}`;
          const blobUrl = `https://${storeHost}${cleanPath}`;
          await del(blobUrl);
          deletedImages.push(url);
          console.log(`✅ Deleted blob: ${blobUrl}`);
        } catch (error) {
          console.warn(`⚠️ Could not delete blob: ${url}`, error);
        }
      }
    } else {
      console.warn('⚠️ BLOB_STORE_HOST not set, skipping image deletion');
    }

    return NextResponse.json({
      success: true,
      message: `Page deleted with ${deletedImages.length} images`,
      deletedImages,
    });

  } catch (error) {
    console.error('Error deleting legal page:', error);
    return NextResponse.json(
      { error: 'Failed to delete legal page' },
      { status: 500 }
    );
  }
}
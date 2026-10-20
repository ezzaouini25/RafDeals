import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { deleteImage } from '@/lib/upload';

// ============================================================
// HELPER: Format view count (1000 -> 1k, 19938 -> 19.9k)
// ============================================================
function formatViews(views: number): string {
  if (views >= 1000000) {
    return (views / 1000000).toFixed(1) + 'M';
  }
  if (views >= 1000) {
    return (views / 1000).toFixed(1) + 'k';
  }
  return String(views);
}

// ============================================================
// GET - Fetch single article by ID (for edit page)
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT 
        a.id,
        a.title,
        a.slug,
        a.description,
        a.content,
        a.cover_image,
        a.read_time,
        a.meta_title,
        a.meta_description,
        a.meta_keywords,
        a.is_active,
        a.is_boosted,
        a.views,
        a.created_at,
        a.updated_at,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        au.id AS author_id,
        au.name AS author_name,
        au.picture AS author_picture
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN authors au ON a.author_id = au.id
      WHERE a.id = ?`,
      [id]
    );

    const article = (rows as any[])[0];

    if (!article) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      article: {
        ...article,
        views_formatted: formatViews(article.views || 0),
        views_raw: article.views || 0,
      }
    });
  } catch (error) {
    console.error('Error fetching article:', error);
    return NextResponse.json(
      { error: 'Failed to fetch article' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Update article
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    const id = parseInt(formData.get('id') as string);

    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    // Get current article
    const [rows] = await pool.execute(
      'SELECT * FROM articles WHERE id = ?',
      [id]
    );
    const currentArticle = (rows as any[])[0];

    if (!currentArticle) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    // Build update dynamically
    const updates: string[] = [];
    const values: any[] = [];

    const title = formData.get('title');
    const slug = formData.get('slug');
    const description = formData.get('description');
    const content = formData.get('content');
    const category_id = formData.get('category_id');
    const author_id = formData.get('author_id');
    const views = formData.get('views');
    const meta_title = formData.get('meta_title');
    const meta_description = formData.get('meta_description');
    const meta_keywords = formData.get('meta_keywords');
    const is_active = formData.get('is_active');
    const is_boosted = formData.get('is_boosted');
    const cover_image = formData.get('cover_image') as string || null;
    const remove_image = formData.get('remove_image') === 'true';

    if (title !== null && title !== '') {
      updates.push('title = ?');
      values.push(title);
    }

    if (slug !== null && slug !== '') {
      // Check if slug exists (excluding current)
      const [existing] = await pool.execute(
        'SELECT id FROM articles WHERE slug = ? AND id != ?',
        [slug, id]
      );
      if ((existing as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Slug already exists' },
          { status: 400 }
        );
      }
      updates.push('slug = ?');
      values.push(slug);
    }

    if (description !== null) {
      updates.push('description = ?');
      values.push(description);
    }

    if (content !== null && content !== '') {
      updates.push('content = ?');
      values.push(content);
      const words = String(content).replace(/<[^>]*>/g, '').split(/\s+/).length;
      const read_time = Math.ceil(words / 200);
      updates.push('read_time = ?');
      values.push(read_time);
    }

    if (category_id !== null) {
      updates.push('category_id = ?');
      values.push(parseInt(category_id as string) || null);
    }

    if (author_id !== null) {
      updates.push('author_id = ?');
      values.push(parseInt(author_id as string) || null);
    }

    // Views update
    if (views !== null) {
      const viewsValue = parseInt(views as string);
      if (!isNaN(viewsValue)) {
        updates.push('views = ?');
        values.push(viewsValue);
      }
    }

    if (meta_title !== null) {
      updates.push('meta_title = ?');
      values.push(meta_title);
    }

    if (meta_description !== null) {
      updates.push('meta_description = ?');
      values.push(meta_description);
    }

    if (meta_keywords !== null) {
      updates.push('meta_keywords = ?');
      values.push(meta_keywords);
    }

    // is_active
    if (is_active !== null) {
      const activeValue = (is_active === 'true' || is_active === '1') ? 1 : 0;
      updates.push('is_active = ?');
      values.push(activeValue);
    }

    // is_boosted
    if (is_boosted !== null) {
      const boostedValue = (is_boosted === 'true' || is_boosted === '1') ? 1 : 0;
      updates.push('is_boosted = ?');
      values.push(boostedValue);
    }

    let finalCoverImage = currentArticle.cover_image;

    if (remove_image && finalCoverImage) {
      await deleteImage(finalCoverImage);
      finalCoverImage = null;
      updates.push('cover_image = ?');
      values.push(null);
    }

    if (cover_image && !remove_image) {
      if (finalCoverImage && finalCoverImage !== cover_image) {
        await deleteImage(finalCoverImage);
      }
      finalCoverImage = cover_image;
      updates.push('cover_image = ?');
      values.push(cover_image);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(id);

    await pool.execute(
      `UPDATE articles SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated article
    const [updatedRows] = await pool.execute(
      `SELECT 
        a.id,
        a.title,
        a.slug,
        a.views,
        c.id AS category_id,
        c.name AS category_name,
        au.id AS author_id,
        au.name AS author_name,
        au.picture AS author_picture
      FROM articles a
      LEFT JOIN categories c ON a.category_id = c.id
      LEFT JOIN authors au ON a.author_id = au.id
      WHERE a.id = ?`,
      [id]
    );
    const updated = (updatedRows as any[])[0];

    return NextResponse.json({
      success: true,
      message: 'Article updated successfully',
      article: updated ? {
        ...updated,
        views_formatted: formatViews(updated.views || 0),
        views_raw: updated.views || 0,
      } : null,
    });
  } catch (error) {
    console.error('Error updating article:', error);
    return NextResponse.json(
      { error: 'Failed to update article' },
      { status: 500 }
    );
  }
}
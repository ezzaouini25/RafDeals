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
// GET - Fetch all articles with search, filters, sorting, pagination
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    // ============================================================
    // FILTERS
    // ============================================================
    const categoryId = searchParams.get('category_id');
    const authorId = searchParams.get('author_id');

    // ============================================================
    // SORTING
    // ============================================================
    const sortField = searchParams.get('sort') || 'created_at';
    const sortOrder = searchParams.get('order') || 'desc';

    // Map frontend sort fields to database columns
    const sortFieldMap: Record<string, string> = {
      'title': 'a.title',
      'category_name': 'c.name',
      'author_name': 'au.name',
      'read_time': 'a.read_time',
      'views_raw': 'a.views',
      'created_at': 'a.created_at',
    };

    const dbSortField = sortFieldMap[sortField] || 'a.created_at';
    const dbSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // ============================================================
    // BUILD WHERE CLAUSE
    // ============================================================
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (a.title LIKE ? OR a.description LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (categoryId && categoryId !== 'all') {
      whereClause += ' AND a.category_id = ?';
      params.push(parseInt(categoryId));
    }

    if (authorId && authorId !== 'all') {
      whereClause += ' AND a.author_id = ?';
      params.push(parseInt(authorId));
    }

    // ============================================================
    // TOTAL COUNT
    // ============================================================
    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM articles a ${whereClause}`,
      params
    );
    const total = (totalResult as any[])[0]?.total || 0;

    // ============================================================
    // MAIN QUERY WITH JOINS
    // ============================================================
    const [items] = await pool.execute(
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
      ${whereClause}
      ORDER BY ${dbSortField} ${dbSortOrder}
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [...params, limit, offset]
    );

    // ============================================================
    // FORMAT VIEWS
    // ============================================================
    const formattedItems = (items as any[]).map((article) => ({
      ...article,
      views_formatted: formatViews(article.views || 0),
      views_raw: article.views || 0,
    }));

    return NextResponse.json({
      articles: formattedItems,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create new article
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const content = formData.get('content') as string;
    const category_id = parseInt(formData.get('category_id') as string) || null;
    const author_id = parseInt(formData.get('author_id') as string) || null;
    const meta_title = formData.get('meta_title') as string;
    const meta_description = formData.get('meta_description') as string;
    const meta_keywords = formData.get('meta_keywords') as string;
    const is_active = formData.get('is_active') === 'true';
    const is_boosted = formData.get('is_boosted') === 'true';
    const cover_image = formData.get('cover_image') as string || null;

    // ============================================================
    // VALIDATION
    // ============================================================
    if (!title || !slug || !content) {
      return NextResponse.json(
        { error: 'Title, slug, and content are required' },
        { status: 400 }
      );
    }

    // Check if slug exists
    const [existing] = await pool.execute(
      'SELECT id FROM articles WHERE slug = ?',
      [slug]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    // Calculate read time (200 words per minute)
    const words = String(content).replace(/<[^>]*>/g, '').split(/\s+/).length;
    const read_time = Math.ceil(words / 200);

    // ============================================================
    // INSERT
    // ============================================================
    const [result] = await pool.execute(
      `INSERT INTO articles 
       (title, slug, description, content, cover_image, 
        category_id, author_id, read_time, 
        meta_title, meta_description, meta_keywords, 
        is_active, is_boosted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        description,
        content,
        cover_image,
        category_id,
        author_id,
        read_time,
        meta_title,
        meta_description,
        meta_keywords,
        is_active ? 1 : 0,
        is_boosted ? 1 : 0
      ]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      slug,
      message: 'Article created successfully',
    });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: 'Failed to create article' },
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

    // ============================================================
    // GET CURRENT ARTICLE
    // ============================================================
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

    // ============================================================
    // BUILD UPDATE DYNAMICALLY
    // ============================================================
    const updates: string[] = [];
    const values: any[] = [];

    const title = formData.get('title');
    const slug = formData.get('slug');
    const description = formData.get('description');
    const content = formData.get('content');
    const category_id = formData.get('category_id');
    const author_id = formData.get('author_id');
    const meta_title = formData.get('meta_title');
    const meta_description = formData.get('meta_description');
    const meta_keywords = formData.get('meta_keywords');
    const is_active = formData.get('is_active');
    const is_boosted = formData.get('is_boosted');
    const cover_image = formData.get('cover_image') as string || null;
    const remove_image = formData.get('remove_image') === 'true';
    const views = formData.get('views');

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
      // Recalculate read time
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

    // ============================================================
    // VIEWS - Update views directly
    // ============================================================
    if (views !== null) {
      const viewsValue = parseInt(views as string);
      if (!isNaN(viewsValue)) {
        updates.push('views = ?');
        values.push(viewsValue);
      }
    }

    // Cover image handling
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

    // ============================================================
    // EXECUTE UPDATE
    // ============================================================
    await pool.execute(
      `UPDATE articles SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated article with formatted views
    const [updatedRows] = await pool.execute(
      `SELECT 
        a.id,
        a.title,
        a.slug,
        a.views,
        c.id AS category_id,
        c.name AS category_name,
        au.id AS author_id,
        au.name AS author_name
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

// ============================================================
// DELETE - Delete article and its images
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Article ID is required' },
        { status: 400 }
      );
    }

    // ============================================================
    // GET ARTICLE DATA FOR IMAGE CLEANUP
    // ============================================================
    const [rows] = await pool.execute(
      'SELECT content, cover_image FROM articles WHERE id = ?',
      [id]
    );

    const articles = rows as any[];
    if (articles.length === 0) {
      return NextResponse.json(
        { error: 'Article not found' },
        { status: 404 }
      );
    }

    const article = articles[0];
    const coverImage = article.cover_image;
    const content = article.content || '';

    // Extract all images from content
    const imageUrls: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      if (src.includes('/uploads/articles/')) {
        imageUrls.push(src);
      }
    }

    // ============================================================
    // DELETE FROM DATABASE
    // ============================================================
    await pool.execute('DELETE FROM articles WHERE id = ?', [id]);

    // ============================================================
    // DELETE IMAGES
    // ============================================================
    if (coverImage) {
      try {
        await deleteImage(coverImage);
      } catch (error) {
        console.warn('Could not delete cover image:', coverImage);
      }
    }

    for (const url of imageUrls) {
      try {
        await deleteImage(url);
      } catch (error) {
        console.warn('Could not delete image:', url);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Article deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting article:', error);
    return NextResponse.json(
      { error: 'Failed to delete article' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifySessionToken } from '@/lib/admin-auth';
import { cookies } from 'next/headers';

// ============================================================
// GET - Fetch all categories with counts
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const sortBy = searchParams.get('sortBy') || 'name';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const typeFilter = searchParams.get('type') || 'all';
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (c.name LIKE ? OR c.slug LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (typeFilter !== 'all') {
      whereClause += ' AND c.type = ?';
      params.push(typeFilter);
    }

    // ORDER BY
    let orderBy = '';
    switch (sortBy) {
      case 'name':
        orderBy = `ORDER BY c.name ${sortOrder}`;
        break;
      case 'type':
        orderBy = `ORDER BY c.type ${sortOrder}`;
        break;
      case 'created_at':
        orderBy = `ORDER BY c.created_at ${sortOrder}`;
        break;
      case 'total_usage':
        orderBy = `ORDER BY total_usage ${sortOrder}`;
        break;
      default:
        orderBy = `ORDER BY c.name ${sortOrder}`;
    }

    // ✅ FIXED: Interpolate LIMIT and OFFSET directly (MySQL 8 rejects LIMIT ? OFFSET ?)
    const [categories] = await pool.execute(
      `SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.type, 
        c.is_active, 
        c.created_at, 
        c.updated_at,
        (SELECT COUNT(*) FROM offers WHERE category_id = c.id AND is_active = 1) as offer_count,
        (SELECT COUNT(*) FROM articles WHERE category_id = c.id AND is_active = 1) as article_count,
        (SELECT COUNT(*) FROM deals WHERE category_id = c.id AND is_active = 1) as deal_count,
        ((SELECT COUNT(*) FROM offers WHERE category_id = c.id AND is_active = 1) + 
         (SELECT COUNT(*) FROM articles WHERE category_id = c.id AND is_active = 1) +
         (SELECT COUNT(*) FROM deals WHERE category_id = c.id AND is_active = 1)) as total_usage
       FROM categories c
       ${whereClause}
       ${orderBy}
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
    );

    let totalWhereClause = 'WHERE 1=1';
    const totalParams: any[] = [];

    if (search) {
      totalWhereClause += ' AND (name LIKE ? OR slug LIKE ?)';
      totalParams.push(`%${search}%`, `%${search}%`);
    }

    if (typeFilter !== 'all') {
      totalWhereClause += ' AND type = ?';
      totalParams.push(typeFilter);
    }

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM categories ${totalWhereClause}`,
      totalParams
    );

    return NextResponse.json({
      categories,
      total: (totalResult as any[])[0]?.total || 0,
      totalPages: Math.ceil(((totalResult as any[])[0]?.total || 0) / limit),
      page,
    });

  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// ============================================================
// POST - Create new category
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, slug, type, is_active } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!slug || slug.trim() === '') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const validTypes = ['offers', 'articles', 'deals', 'both'];
    const normalizedType = validTypes.includes(type) ? type : 'offers';

    const [existing] = await pool.execute(
      'SELECT id FROM categories WHERE slug = ?',
      [slug.trim()]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const [result] = await pool.execute(
      'INSERT INTO categories (name, slug, type, is_active) VALUES (?, ?, ?, ?)',
      [name.trim(), slug.trim(), normalizedType, is_active ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      message: 'Category created successfully'
    });

  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

// ============================================================
// PUT - Update category
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get('id') || '0');

    if (isNaN(id) || id === 0) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const body = await request.json();
    const { name, slug, type, is_active } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!slug || slug.trim() === '') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    const validTypes = ['offers', 'articles', 'deals', 'both'];
    const normalizedType = validTypes.includes(type) ? type : 'offers';

    const [existing] = await pool.execute(
      'SELECT id FROM categories WHERE slug = ? AND id != ?',
      [slug.trim(), id]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    await pool.execute(
      'UPDATE categories SET name = ?, slug = ?, type = ?, is_active = ? WHERE id = ?',
      [name.trim(), slug.trim(), normalizedType, is_active ? 1 : 0, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Category updated successfully'
    });

  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// ============================================================
// DELETE - Delete category
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get('id') || '0');

    if (isNaN(id) || id === 0) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [offersCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM offers WHERE category_id = ?',
      [id]
    );
    const [articlesCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM articles WHERE category_id = ?',
      [id]
    );
    const [dealsCount] = await pool.execute(
      'SELECT COUNT(*) as count FROM deals WHERE category_id = ?',
      [id]
    );

    const offerCount = (offersCount as any[])[0]?.count || 0;
    const articleCount = (articlesCount as any[])[0]?.count || 0;
    const dealCount = (dealsCount as any[])[0]?.count || 0;

    if (offerCount > 0 || articleCount > 0 || dealCount > 0) {
      const parts: string[] = [];
      if (offerCount > 0) parts.push(`${offerCount} offer(s)`);
      if (articleCount > 0) parts.push(`${articleCount} article(s)`);
      if (dealCount > 0) parts.push(`${dealCount} deal(s)`);

      return NextResponse.json(
        { error: `Cannot delete category. It is used in ${parts.join(', ')}.` },
        { status: 400 }
      );
    }

    await pool.execute('DELETE FROM categories WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
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

    // Type filter now checks the correct flag column
    if (typeFilter === 'offers') {
      whereClause += ' AND c.for_offers = 1';
    } else if (typeFilter === 'deals') {
      whereClause += ' AND c.for_deals = 1';
    } else if (typeFilter === 'articles') {
      whereClause += ' AND c.for_articles = 1';
    }

    // ORDER BY
    let orderBy = '';
    switch (sortBy) {
      case 'name':
        orderBy = `ORDER BY c.name ${sortOrder}`;
        break;
      case 'type':
        // Sort by "how many types" — categories with more types come last (or first depending on sortOrder)
        orderBy = `ORDER BY (c.for_offers + c.for_deals + c.for_articles) ${sortOrder}`;
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

    // ✅ Interpolate LIMIT and OFFSET directly (MySQL 8 rejects LIMIT ? OFFSET ?)
    const [categories] = await pool.execute(
      `SELECT 
        c.id, 
        c.name, 
        c.slug, 
        c.for_offers, 
        c.for_deals, 
        c.for_articles, 
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

    if (typeFilter === 'offers') {
      totalWhereClause += ' AND for_offers = 1';
    } else if (typeFilter === 'deals') {
      totalWhereClause += ' AND for_deals = 1';
    } else if (typeFilter === 'articles') {
      totalWhereClause += ' AND for_articles = 1';
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
    const { name, slug, for_offers, for_deals, for_articles, is_active } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!slug || slug.trim() === '') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // At least one type must be selected
    if (!for_offers && !for_deals && !for_articles) {
      return NextResponse.json({ error: 'Pick at least one type (Offers, Deals, or Articles)' }, { status: 400 });
    }

    const fOffers = for_offers ? 1 : 0;
    const fDeals = for_deals ? 1 : 0;
    const fArticles = for_articles ? 1 : 0;

    // Duplicate check: same slug AND same flag combination → reject.
    // Same slug, different flag combo → allowed.
    const [existing] = await pool.execute(
      `SELECT id FROM categories 
       WHERE slug = ? AND for_offers = ? AND for_deals = ? AND for_articles = ?`,
      [slug.trim(), fOffers, fDeals, fArticles]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'A category with this slug and these exact types already exists' },
        { status: 400 }
      );
    }

    // Keep the legacy `type` column populated for backward compat with any
    // code path that hasn't been updated yet. Derive it from the flags.
    const legacyType =
      fOffers && fDeals && fArticles ? 'both' :
      fOffers && !fDeals && !fArticles ? 'offers' :
      !fOffers && fDeals && !fArticles ? 'deals' :
      !fOffers && !fDeals && fArticles ? 'articles' :
      'both'; // any multi-flag combo → 'both'

    const [result] = await pool.execute(
      `INSERT INTO categories (name, slug, for_offers, for_deals, for_articles, type, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), slug.trim(), fOffers, fDeals, fArticles, legacyType, is_active ? 1 : 0]
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
    const { name, slug, for_offers, for_deals, for_articles, is_active } = body;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    if (!slug || slug.trim() === '') {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    if (!for_offers && !for_deals && !for_articles) {
      return NextResponse.json({ error: 'Pick at least one type (Offers, Deals, or Articles)' }, { status: 400 });
    }

    const fOffers = for_offers ? 1 : 0;
    const fDeals = for_deals ? 1 : 0;
    const fArticles = for_articles ? 1 : 0;

    const [existing] = await pool.execute(
      `SELECT id FROM categories 
       WHERE slug = ? AND id != ? AND for_offers = ? AND for_deals = ? AND for_articles = ?`,
      [slug.trim(), id, fOffers, fDeals, fArticles]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'A category with this slug and these exact types already exists' },
        { status: 400 }
      );
    }

    const legacyType =
      fOffers && fDeals && fArticles ? 'both' :
      fOffers && !fDeals && !fArticles ? 'offers' :
      !fOffers && fDeals && !fArticles ? 'deals' :
      !fOffers && !fDeals && fArticles ? 'articles' :
      'both';

    await pool.execute(
      `UPDATE categories 
       SET name = ?, slug = ?, for_offers = ?, for_deals = ?, for_articles = ?, type = ?, is_active = ? 
       WHERE id = ?`,
      [name.trim(), slug.trim(), fOffers, fDeals, fArticles, legacyType, is_active ? 1 : 0, id]
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
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { deleteImage } from '@/lib/upload';

// ============================================================
// HELPER: Format view count
// ============================================================
function formatViews(views: number): string {
  if (views >= 1000000) return (views / 1000000).toFixed(1) + 'M';
  if (views >= 1000) return (views / 1000).toFixed(1) + 'k';
  return String(views);
}

// ============================================================
// GET - List deals with search, filters, sorting, pagination
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const categoryId = searchParams.get('category_id');
    const authorId = searchParams.get('author_id');

    const sortField = searchParams.get('sort') || 'created_at';
    const sortOrder = searchParams.get('order') || 'desc';

    const sortFieldMap: Record<string, string> = {
      'title': 'd.title',
      'category_name': 'c.name',
      'author_name': 'au.name',
      'rating': 'd.rating',
      'views_raw': 'd.views',
      'clicks_raw': 'd.clicks',
      'created_at': 'd.created_at',
    };

    const dbSortField = sortFieldMap[sortField] || 'd.created_at';
    const dbSortOrder = sortOrder === 'asc' ? 'ASC' : 'DESC';

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (d.title LIKE ? OR d.content LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (categoryId && categoryId !== 'all') {
      whereClause += ' AND d.category_id = ?';
      params.push(parseInt(categoryId));
    }

    if (authorId && authorId !== 'all') {
      whereClause += ' AND d.author_id = ?';
      params.push(parseInt(authorId));
    }

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM deals d ${whereClause}`,
      params
    );
    const total = (totalResult as any[])[0]?.total || 0;

    const [items] = await pool.execute(
      `SELECT 
        d.id,
        d.title,
        d.slug,
        d.content,
        d.cover_image,
        d.offer_link,
        d.payout_amount,
        d.pay_name,
        d.brand_name,
        d.rating,
        d.withdraw_method,
        d.country,
        d.verified_date,
        d.meta_title,
        d.meta_description,
        d.meta_keywords,
        d.is_active,
        d.is_boosted,
        d.views,
        d.clicks,
        d.created_at,
        d.updated_at,
        c.id AS category_id,
        c.name AS category_name,
        c.slug AS category_slug,
        au.id AS author_id,
        au.name AS author_name,
        au.picture AS author_picture
      FROM deals d
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN authors au ON d.author_id = au.id
      ${whereClause}
      ORDER BY ${dbSortField} ${dbSortOrder}
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const formattedItems = (items as any[]).map((deal) => ({
      ...deal,
      views_formatted: formatViews(deal.views || 0),
      views_raw: deal.views || 0,
      clicks_formatted: formatViews(deal.clicks || 0),
      clicks_raw: deal.clicks || 0,
    }));

    return NextResponse.json({
      deals: formattedItems,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

// ============================================================
// POST - Create new deal
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const offer_link = formData.get('offer_link') as string;
    const category_id = parseInt(formData.get('category_id') as string) || null;
    const author_id = parseInt(formData.get('author_id') as string) || null;
    const payout_amount = formData.get('payout_amount') as string;
    const pay_name = (formData.get('pay_name') as string) || null;
    const brand_name = (formData.get('brand_name') as string) || null;
    const rating = formData.get('rating') as string;
    const withdraw_method = formData.get('withdraw_method') as string;
    const country = (formData.get('country') as string) || '';
    const verified_date = formData.get('verified_date') as string;
    const meta_title = formData.get('meta_title') as string;
    const meta_description = formData.get('meta_description') as string;
    const meta_keywords = formData.get('meta_keywords') as string;
    const is_active = formData.get('is_active') === 'true';
    const is_boosted = formData.get('is_boosted') === 'true';
    const cover_image = (formData.get('cover_image') as string) || null;

    if (!title || !slug || !content || !offer_link) {
      return NextResponse.json(
        { error: 'Title, slug, content, and deal link are required' },
        { status: 400 }
      );
    }

    const [existing] = await pool.execute(
      'SELECT id FROM deals WHERE slug = ?',
      [slug]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
    }

    const [result] = await pool.execute(
      `INSERT INTO deals 
       (title, slug, content, cover_image, offer_link,
        category_id, author_id, payout_amount, pay_name, brand_name,
        rating, withdraw_method, country, verified_date,
        meta_title, meta_description, meta_keywords,
        is_active, is_boosted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        slug,
        content,
        cover_image,
        offer_link,
        category_id,
        author_id,
        payout_amount || null,
        pay_name,
        brand_name,
        rating || null,
        withdraw_method || null,
        country,
        verified_date || null,
        meta_title || null,
        meta_description || null,
        meta_keywords || null,
        is_active ? 1 : 0,
        is_boosted ? 1 : 0,
      ]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      slug,
      message: 'Deal created successfully',
    });
  } catch (error) {
    console.error('Error creating deal:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}

// ============================================================
// PUT - Update deal
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();
    const id = parseInt(formData.get('id') as string);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [rows] = await pool.execute('SELECT * FROM deals WHERE id = ?', [id]);
    const currentDeal = (rows as any[])[0];

    if (!currentDeal) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    const title = formData.get('title');
    const slug = formData.get('slug');
    const content = formData.get('content');
    const offer_link = formData.get('offer_link');
    const category_id = formData.get('category_id');
    const author_id = formData.get('author_id');
    const payout_amount = formData.get('payout_amount');
    const pay_name = formData.get('pay_name');
    const brand_name = formData.get('brand_name');
    const rating = formData.get('rating');
    const withdraw_method = formData.get('withdraw_method');
    const country = formData.get('country');
    const verified_date = formData.get('verified_date');
    const views = formData.get('views');
    const clicks = formData.get('clicks');
    const meta_title = formData.get('meta_title');
    const meta_description = formData.get('meta_description');
    const meta_keywords = formData.get('meta_keywords');
    const is_active = formData.get('is_active');
    const is_boosted = formData.get('is_boosted');
    const cover_image = (formData.get('cover_image') as string) || null;
    const remove_image = formData.get('remove_image') === 'true';

    if (title !== null && title !== '') {
      updates.push('title = ?');
      values.push(title);
    }

    if (slug !== null && slug !== '') {
      const [existing] = await pool.execute(
        'SELECT id FROM deals WHERE slug = ? AND id != ?',
        [slug, id]
      );
      if ((existing as any[]).length > 0) {
        return NextResponse.json({ error: 'Slug already exists' }, { status: 400 });
      }
      updates.push('slug = ?');
      values.push(slug);
    }

    if (content !== null && content !== '') {
      updates.push('content = ?');
      values.push(content);
    }

    if (offer_link !== null && offer_link !== '') {
      updates.push('offer_link = ?');
      values.push(offer_link);
    }

    if (category_id !== null) {
      updates.push('category_id = ?');
      values.push(parseInt(category_id as string) || null);
    }

    if (author_id !== null) {
      updates.push('author_id = ?');
      values.push(parseInt(author_id as string) || null);
    }

    if (payout_amount !== null) {
      updates.push('payout_amount = ?');
      values.push(payout_amount);
    }

    if (pay_name !== null) {
      updates.push('pay_name = ?');
      values.push(pay_name === '' ? null : pay_name);
    }

    if (brand_name !== null) {
      updates.push('brand_name = ?');
      values.push(brand_name === '' ? null : brand_name);
    }

    if (rating !== null && rating !== '') {
      updates.push('rating = ?');
      values.push(parseFloat(rating as string));
    }

    if (withdraw_method !== null) {
      updates.push('withdraw_method = ?');
      values.push(withdraw_method);
    }

    if (country !== null) {
      updates.push('country = ?');
      values.push(country);
    }

    if (verified_date !== null && verified_date !== '') {
      updates.push('verified_date = ?');
      values.push(verified_date);
    }

    if (views !== null) {
      const viewsValue = parseInt(views as string);
      if (!isNaN(viewsValue)) {
        updates.push('views = ?');
        values.push(viewsValue);
      }
    }

    if (clicks !== null) {
      const clicksValue = parseInt(clicks as string);
      if (!isNaN(clicksValue)) {
        updates.push('clicks = ?');
        values.push(clicksValue);
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

    if (is_active !== null) {
      updates.push('is_active = ?');
      values.push(is_active === 'true' || is_active === '1' ? 1 : 0);
    }

    if (is_boosted !== null) {
      updates.push('is_boosted = ?');
      values.push(is_boosted === 'true' || is_boosted === '1' ? 1 : 0);
    }

    let finalCoverImage = currentDeal.cover_image;

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
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(id);

    await pool.execute(
      `UPDATE deals SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedRows] = await pool.execute(
      `SELECT 
        d.id,
        d.title,
        d.slug,
        d.views,
        d.clicks,
        d.pay_name,
        d.brand_name,
        c.id AS category_id,
        c.name AS category_name,
        au.id AS author_id,
        au.name AS author_name
      FROM deals d
      LEFT JOIN categories c ON d.category_id = c.id
      LEFT JOIN authors au ON d.author_id = au.id
      WHERE d.id = ?`,
      [id]
    );
    const updated = (updatedRows as any[])[0];

    return NextResponse.json({
      success: true,
      message: 'Deal updated successfully',
      deal: updated
        ? {
            ...updated,
            views_formatted: formatViews(updated.views || 0),
            views_raw: updated.views || 0,
            clicks_formatted: formatViews(updated.clicks || 0),
            clicks_raw: updated.clicks || 0,
          }
        : null,
    });
  } catch (error) {
    console.error('Error updating deal:', error);
    return NextResponse.json({ error: 'Failed to update deal' }, { status: 500 });
  }
}

// ============================================================
// DELETE - Delete deal and its images
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Deal ID is required' }, { status: 400 });
    }

    const [rows] = await pool.execute(
      'SELECT content, cover_image FROM deals WHERE id = ?',
      [id]
    );

    const deals = rows as any[];
    if (deals.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 });
    }

    const deal = deals[0];
    const coverImage = deal.cover_image;
    const content = deal.content || '';

    const imageUrls: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      if (src.includes('/uploads/deals/')) {
        imageUrls.push(src);
      }
    }

    await pool.execute('DELETE FROM deals WHERE id = ?', [id]);

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
      message: 'Deal deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting deal:', error);
    return NextResponse.json({ error: 'Failed to delete deal' }, { status: 500 });
  }
}
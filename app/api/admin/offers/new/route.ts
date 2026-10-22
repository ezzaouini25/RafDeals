import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { deleteImage } from '@/lib/upload';

// ✅ GET - Fetch all offers with search & pagination
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (title LIKE ? OR content LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM offers ${whereClause}`,
      params
    );
    const total = (totalResult as any[])[0]?.total || 0;

    const [items] = await pool.execute(
      `SELECT 
        id, title, slug, content, cover_image, offer_link,
        payout_amount, pay_name, brand_name, rating, withdraw_method,
        category_id, author_id, country, verified_date,
        meta_title, meta_description, meta_keywords,
        is_active, is_boosted, created_at, updated_at
      FROM offers
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      offers: items,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}

// ✅ POST - Create new offer
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const title = formData.get('title') as string;
    const slug = formData.get('slug') as string;
    const content = formData.get('content') as string;
    const offer_link = formData.get('offer_link') as string;
    const payout_amount = formData.get('payout_amount') as string;
    const pay_name = (formData.get('pay_name') as string) || null;
    const brand_name = (formData.get('brand_name') as string) || null;
    const category_id_raw = formData.get('category_id') as string;
    const category_id = category_id_raw ? parseInt(category_id_raw) : null;
    const author_id_raw = formData.get('author_id') as string;
    const author_id = author_id_raw ? parseInt(author_id_raw) : null;
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
        { error: 'Title, slug, content, and offer link are required' },
        { status: 400 }
      );
    }

    const [existing] = await pool.execute(
      'SELECT id FROM offers WHERE slug = ?',
      [slug]
    );
    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Slug already exists' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO offers 
       (title, slug, content, cover_image, offer_link, 
        category_id, author_id, payout_amount, pay_name, brand_name, rating, 
        withdraw_method, country, verified_date,
        meta_title, meta_description, meta_keywords, 
        is_active, is_boosted)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title, slug, content, cover_image, offer_link,
        category_id, author_id, payout_amount, pay_name, brand_name, rating || null,
        withdraw_method, country, verified_date || null,
        meta_title, meta_description, meta_keywords,
        is_active ? 1 : 0, is_boosted ? 1 : 0,
      ]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      slug,
      message: 'Offer created successfully',
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update offer (supports partial updates)
export async function PUT(request: NextRequest) {
  try {
    const formData = await request.formData();

    const id = parseInt(formData.get('id') as string);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [rows] = await pool.execute('SELECT * FROM offers WHERE id = ?', [id]);
    const currentOffer = (rows as any[])[0];

    if (!currentOffer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    const title = formData.get('title');
    const slug = formData.get('slug');
    const content = formData.get('content');
    const offer_link = formData.get('offer_link');
    const payout_amount = formData.get('payout_amount');
    const pay_name = formData.get('pay_name');
    const brand_name = formData.get('brand_name');
    const category_id = formData.get('category_id');
    const author_id = formData.get('author_id');
    const rating = formData.get('rating');
    const withdraw_method = formData.get('withdraw_method');
    const country = formData.get('country');
    const verified_date = formData.get('verified_date');
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
    if (category_id !== null) {
      const cid = parseInt(category_id as string);
      updates.push('category_id = ?');
      values.push(isNaN(cid) ? null : cid);
    }
    if (author_id !== null) {
      const aid = parseInt(author_id as string);
      updates.push('author_id = ?');
      values.push(isNaN(aid) ? null : aid);
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

    let finalCoverImage = currentOffer.cover_image;

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
      `UPDATE offers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    return NextResponse.json({
      success: true,
      message: 'Offer updated successfully',
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    return NextResponse.json(
      { error: 'Failed to update offer' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Delete offer and its images
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Offer ID is required' }, { status: 400 });
    }

    const [rows] = await pool.execute(
      'SELECT content, cover_image FROM offers WHERE id = ?',
      [id]
    );

    const offers = rows as any[];
    if (offers.length === 0) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    const offer = offers[0];
    const coverImage = offer.cover_image;
    const content = offer.content || '';

    const imageUrls: string[] = [];
    const imgRegex = /<img[^>]+src=["']([^"']+)["']/g;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const src = match[1];
      if (src.includes('/uploads/offers/')) {
        imageUrls.push(src);
      }
    }

    await pool.execute('DELETE FROM offers WHERE id = ?', [id]);

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
      message: `Offer deleted successfully`,
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: 'Failed to delete offer' },
      { status: 500 }
    );
  }
}
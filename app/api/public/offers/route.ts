import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const country = searchParams.get('country') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'newest';

    let whereClause = 'WHERE o.is_active = 1';
    const params: any[] = [];

    // ✅ Filter by Country
    if (country && country !== 'all') {
      whereClause += ' AND (o.country LIKE ? OR o.country = ?)';
      params.push(`%${country}%`, country);
    }

    // ✅ Filter by Category
    if (category && category !== 'all') {
      whereClause += ' AND c.slug = ?';
      params.push(category);
    }

    // ✅ Sort (Newest / Oldest)
    let orderBy = 'ORDER BY o.created_at DESC';
    if (sort === 'oldest') {
      orderBy = 'ORDER BY o.created_at ASC';
    }

    const [rows] = await pool.execute(
      `SELECT 
        o.*,
        au.name as author_name,
        c.id as category_id,
        c.name as category_name,
        c.slug as category_slug
       FROM offers o
       LEFT JOIN authors au ON o.author_id = au.id
       LEFT JOIN categories c ON o.category_id = c.id
       ${whereClause}
       ${orderBy}`,
      params
    );

    return NextResponse.json({ offers: rows });
  } catch (error) {
    console.error('Error fetching offers:', error);
    return NextResponse.json({ error: 'Failed to fetch offers' }, { status: 500 });
  }
}
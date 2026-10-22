import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (type !== 'all') {
      whereClause += ' AND type = ?';
      params.push(type);
    }

    if (status === 'approved') {
      whereClause += ' AND is_approved = 1';
    } else if (status === 'pending') {
      whereClause += ' AND is_approved = 0';
    }

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
    console.error('Error fetching members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
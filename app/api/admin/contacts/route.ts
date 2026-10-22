import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const filter = searchParams.get('filter') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 15;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (name LIKE ? OR email LIKE ? OR message LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filter === 'read') {
      whereClause += ' AND is_read = 1';
    } else if (filter === 'unread') {
      whereClause += ' AND is_read = 0';
    }

    const [contacts] = await pool.execute(
      `SELECT id, name, email, message, created_at, is_read 
       FROM contact_messages 
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [...params, limit, offset]
    );

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM contact_messages ${whereClause}`,
      params
    );

    const total = (totalResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      contacts,
      total,
      totalPages,
      page,
    });

  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}
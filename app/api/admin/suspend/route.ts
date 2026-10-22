import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// ✅ GET - Fetch all rate limit blocks
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (ip_address LIKE ? OR device_fingerprint LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM rate_limit_blocks ${whereClause}`,
      params
    );
    const total = (totalResult as any[])[0]?.total || 0;

    const [rows] = await pool.execute(
      `SELECT id, ip_address, device_fingerprint, blocked_until, reason, created_at
       FROM rate_limit_blocks
       ${whereClause}
       ORDER BY blocked_until ASC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      blocks: rows,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching rate limit blocks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch rate limit blocks' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Remove block (unblock)
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Block ID is required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM rate_limit_blocks WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Block removed successfully',
    });
  } catch (error) {
    console.error('Error deleting block:', error);
    return NextResponse.json(
      { error: 'Failed to delete block' },
      { status: 500 }
    );
  }
}

// ✅ PATCH - Extend blocked_until duration
export async function PATCH(request: NextRequest) {
  try {
    const { id, hours } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Block ID is required' },
        { status: 400 }
      );
    }

    if (!hours || hours < 1) {
      return NextResponse.json(
        { error: 'Hours must be at least 1' },
        { status: 400 }
      );
    }

    // ✅ MAX LIMIT: 8760 hours (1 year)
    const MAX_HOURS = 8760;
    if (hours > MAX_HOURS) {
      return NextResponse.json(
        { 
          error: `Maximum is ${MAX_HOURS} hours (1 year)`,
          max: MAX_HOURS
        },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'UPDATE rate_limit_blocks SET blocked_until = DATE_ADD(NOW(), INTERVAL ? HOUR) WHERE id = ?',
      [hours, id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Block not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Block extended by ${hours} hours`,
    });
  } catch (error) {
    console.error('Error extending block:', error);
    return NextResponse.json(
      { error: 'Failed to extend block' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// ============================================================
// GET - Fetch all subscriptions with search & pagination
// ============================================================
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
      whereClause += ' AND email LIKE ?';
      params.push(`%${search}%`);
    }

    // Get subscriptions
    const [subscriptions] = await pool.execute(
      `SELECT id, email, ip_address, device_fingerprint, created_at
       FROM subscriptions
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    // Get total count
    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM subscriptions ${whereClause}`,
      params
    );

    return NextResponse.json({
      subscriptions,
      total: totalResult[0]?.total || 0,
      totalPages: Math.ceil((totalResult[0]?.total || 0) / limit),
      page,
    });
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Delete subscription by ID
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    // Check if subscription exists
    const [existing] = await pool.execute(
      'SELECT id FROM subscriptions WHERE id = ?',
      [id]
    );

    if ((existing as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    await pool.execute('DELETE FROM subscriptions WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Subscription deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting subscription:', error);
    return NextResponse.json(
      { error: 'Failed to delete subscription' },
      { status: 500 }
    );
  }
}
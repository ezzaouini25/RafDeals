import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// ✅ GET - Fetch all sponsors with search & pagination
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
      whereClause += ' AND (name LIKE ? OR size LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm);
    }

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM sponsors ${whereClause}`,
      params
    );
    const total = (totalResult as any[])[0]?.total || 0;

    const [items] = await pool.execute(
      `SELECT 
        id, name, size, code, is_active, is_boosted, 
        impressions, clicks, priority, created_at, updated_at
      FROM sponsors
      ${whereClause}
      ORDER BY is_boosted DESC, is_active DESC, impressions ASC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      sponsors: items,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsors' },
      { status: 500 }
    );
  }
}

// ✅ POST - Create new sponsor
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, size, code, is_active, is_boosted, priority } = body;

    if (!name || !size || !code) {
      return NextResponse.json(
        { error: 'Name, size, and code are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO sponsors 
       (name, size, code, is_active, is_boosted, priority)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, size, code, is_active !== false ? 1 : 0, is_boosted !== false ? 1 : 0, priority || 1]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      message: 'Sponsor created successfully',
    });
  } catch (error) {
    console.error('Error creating sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to create sponsor' },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update sponsor
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { id, name, size, code, is_active, is_boosted, priority } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Sponsor ID is required' },
        { status: 400 }
      );
    }

    if (!name || !size || !code) {
      return NextResponse.json(
        { error: 'Name, size, and code are required' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      'SELECT id FROM sponsors WHERE id = ?',
      [id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      );
    }

    await pool.execute(
      `UPDATE sponsors 
       SET name = ?, size = ?, code = ?, 
           is_active = ?, is_boosted = ?, priority = ?
       WHERE id = ?`,
      [name, size, code, is_active !== false ? 1 : 0, is_boosted !== false ? 1 : 0, priority || 1, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Sponsor updated successfully',
    });
  } catch (error) {
    console.error('Error updating sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to update sponsor' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Delete sponsor
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Sponsor ID is required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM sponsors WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Sponsor not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Sponsor deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting sponsor:', error);
    return NextResponse.json(
      { error: 'Failed to delete sponsor' },
      { status: 500 }
    );
  }
}

// ✅ POST - Track impression
async function trackImpression(id: number): Promise<void> {
  await pool.execute(
    'UPDATE sponsors SET impressions = impressions + 1 WHERE id = ?',
    [id]
  );
}

// ✅ POST - Track click
async function trackClick(id: number): Promise<void> {
  await pool.execute(
    'UPDATE sponsors SET clicks = clicks + 1 WHERE id = ?',
    [id]
  );
}
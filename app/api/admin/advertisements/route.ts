import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// ✅ GET - Fetch all advertisements with search & pagination
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
      `SELECT COUNT(*) as total FROM advertisements ${whereClause}`,
      params
    );
    const total = (totalResult as any[])[0]?.total || 0;

    const [items] = await pool.execute(
      `SELECT 
        id, name, ad_data, size, is_active, created_at, updated_at
      FROM advertisements
      ${whereClause}
      ORDER BY is_active DESC, created_at DESC
      LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      advertisements: items,
      total,
      totalPages: Math.ceil(total / limit),
      page,
      limit,
    });
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch advertisements' },
      { status: 500 }
    );
  }
}

// ✅ POST - Create new advertisement
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, ad_data, size, is_active } = body;

    if (!name || !ad_data || !size) {
      return NextResponse.json(
        { error: 'Name, ad_data, and size are required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      `INSERT INTO advertisements 
       (name, ad_data, size, is_active)
       VALUES (?, ?, ?, ?)`,
      [name, ad_data, size, is_active !== false ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      message: 'Advertisement created successfully',
    });
  } catch (error) {
    console.error('Error creating advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to create advertisement' },
      { status: 500 }
    );
  }
}

// ✅ PUT - Update advertisement
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { id, name, ad_data, size, is_active } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Advertisement ID is required' },
        { status: 400 }
      );
    }

    if (!name || !ad_data || !size) {
      return NextResponse.json(
        { error: 'Name, ad_data, and size are required' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      'SELECT id FROM advertisements WHERE id = ?',
      [id]
    );
    if ((rows as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    await pool.execute(
      `UPDATE advertisements 
       SET name = ?, ad_data = ?, size = ?, is_active = ?
       WHERE id = ?`,
      [name, ad_data, size, is_active !== false ? 1 : 0, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Advertisement updated successfully',
    });
  } catch (error) {
    console.error('Error updating advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to update advertisement' },
      { status: 500 }
    );
  }
}

// ✅ DELETE - Delete advertisement
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Advertisement ID is required' },
        { status: 400 }
      );
    }

    const [result] = await pool.execute(
      'DELETE FROM advertisements WHERE id = ?',
      [id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: 'Advertisement not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Advertisement deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    return NextResponse.json(
      { error: 'Failed to delete advertisement' },
      { status: 500 }
    );
  }
}
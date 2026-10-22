import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ============================================================
// GET - Fetch all users with search & pagination
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
      whereClause += ' AND (username LIKE ? OR email LIKE ? OR name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    const [users] = await pool.execute(
      `SELECT id, username, email, name, role, is_active, is_blocked, created_at
       FROM users
       ${whereClause}
       ORDER BY created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      [...params, limit, offset]
    );

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM users ${whereClause}`,
      params
    );

    return NextResponse.json({
      users,
      total: (totalResult as any[])[0]?.total || 0,
      totalPages: Math.ceil(((totalResult as any[])[0]?.total || 0) / limit),
      page,
    });

  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create new user
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const { username, email, name, password, role, is_active, is_blocked } = await request.json();

    // Check if username or email already exists
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if ((existing as any[]).length > 0) {
      return NextResponse.json(
        { error: 'Username or email already exists' },
        { status: 400 }
      );
    }

    const hashedPassword = hashPassword(password);

    const [result] = await pool.execute(
      `INSERT INTO users (username, email, name, password, role, is_active, is_blocked)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username, email, name || null, hashedPassword, role || 'user', is_active !== false, is_blocked === true]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Update user (name, email, username, role, status)
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const { id, username, email, name, password, role, is_active, is_blocked } = await request.json();

    let query = 'UPDATE users SET username = ?, email = ?, name = ?, role = ?, is_active = ?, is_blocked = ?';
    const params: any[] = [username, email, name || null, role || 'user', is_active !== false, is_blocked === true];

    if (password && password.length > 0) {
      query += ', password = ?';
      params.push(hashPassword(password));
    }

    query += ' WHERE id = ?';
    params.push(id);

    await pool.execute(query, params);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Delete user
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    await pool.execute('DELETE FROM users WHERE id = ?', [id]);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    );
  }
}

// ============================================================
// PATCH - Change password only
// ============================================================
export async function PATCH(request: NextRequest) {
  try {
    const { id, password } = await request.json();

    const hashedPassword = hashPassword(password);

    await pool.execute(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, id]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error changing password:', error);
    return NextResponse.json(
      { error: 'Failed to change password' },
      { status: 500 }
    );
  }
}
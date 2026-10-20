import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifySessionToken } from '@/lib/admin-auth';
import crypto from 'crypto';

// Hash password using SHA-256 (same as login)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// ============================================================
// Helper - Get current user from session
// ============================================================
async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  
  if (!token) {
    return null;
  }

  const user = verifySessionToken(token);
  return user;
}

// ============================================================
// GET - Fetch current user profile
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const [rows] = await pool.execute(
      `SELECT 
        id,
        name,
        username,
        email,
        role,
        is_active,
        is_blocked,
        created_at
      FROM users 
      WHERE id = ? AND is_active = 1 AND is_blocked = 0`,
      [sessionUser.id]
    );

    const user = (rows as any[])[0];

    if (!user) {
      return NextResponse.json(
        { error: 'User not found or inactive' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Update current user profile
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    
    if (!sessionUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, username, email, currentPassword, newPassword } = body;

    // Check if user exists
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [sessionUser.id]
    );
    const currentUser = (rows as any[])[0];

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const updates: string[] = [];
    const values: any[] = [];

    // Update name
    if (name !== undefined && name !== '') {
      updates.push('name = ?');
      values.push(name);
    }

    // Update username with uniqueness check
    if (username !== undefined && username !== '') {
      const [existingUsername] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, sessionUser.id]
      );
      if ((existingUsername as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Username already exists' },
          { status: 400 }
        );
      }
      updates.push('username = ?');
      values.push(username);
    }

    // Update email with uniqueness check
    if (email !== undefined && email !== '') {
      const [existingEmail] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, sessionUser.id]
      );
      if ((existingEmail as any[]).length > 0) {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 400 }
        );
      }
      updates.push('email = ?');
      values.push(email);
    }

    // Update password if provided
    if (newPassword && newPassword !== '') {
      // Verify current password using SHA-256
      const hashedCurrent = hashPassword(currentPassword || '');
      
      if (hashedCurrent !== currentUser.password) {
        return NextResponse.json(
          { error: 'Current password is incorrect' },
          { status: 400 }
        );
      }

      // Hash new password using SHA-256
      const hashedNew = hashPassword(newPassword);
      updates.push('password = ?');
      values.push(hashedNew);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      );
    }

    values.push(sessionUser.id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    // Get updated user (exclude password)
    const [updatedRows] = await pool.execute(
      `SELECT 
        id,
        name,
        username,
        email,
        role,
        is_active,
        is_blocked,
        created_at
      FROM users WHERE id = ?`,
      [sessionUser.id]
    );
    const updated = (updatedRows as any[])[0];

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updated,
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}
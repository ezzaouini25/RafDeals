import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import pool from '@/lib/db';
import { verifySessionToken } from '@/lib/admin-auth';
import crypto from 'crypto';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

// ============================================================
// GET - Fetch current user profile
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [rows] = await pool.execute(
      `SELECT id, name, username, email, role, is_active, is_blocked, created_at, picture
       FROM users 
       WHERE id = ? AND is_active = 1 AND is_blocked = 0`,
      [sessionUser.id]
    );

    const user = (rows as any[])[0];
    if (!user) {
      return NextResponse.json({ error: 'User not found or inactive' }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// ============================================================
// PUT - Update current user profile
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const sessionUser = await getCurrentUser();
    if (!sessionUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // ✅ Receive FormData (to support image uploads)
    const formData = await request.formData();
    
    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;
    const pictureFile = formData.get('picture') as File | null;
    const removePicture = formData.get('remove_picture') === 'true';

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ?',
      [sessionUser.id]
    );
    const currentUser = (rows as any[])[0];

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const values: any[] = [];

    // Update name
    if (name !== undefined && name !== '') {
      updates.push('name = ?');
      values.push(name);
    }

    // Update username
    if (username !== undefined && username !== '') {
      const [existingUsername] = await pool.execute(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, sessionUser.id]
      );
      if ((existingUsername as any[]).length > 0) {
        return NextResponse.json({ error: 'Username already exists' }, { status: 400 });
      }
      updates.push('username = ?');
      values.push(username);
    }

    // Update email
    if (email !== undefined && email !== '') {
      const [existingEmail] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, sessionUser.id]
      );
      if ((existingEmail as any[]).length > 0) {
        return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
      }
      updates.push('email = ?');
      values.push(email);
    }

    // Update password
    if (newPassword && newPassword !== '') {
      const hashedCurrent = hashPassword(currentPassword || '');
      if (hashedCurrent !== currentUser.password) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
      }
      const hashedNew = hashPassword(newPassword);
      updates.push('password = ?');
      values.push(hashedNew);
    }

    // ✅ Handle Image Upload
    let picturePath = currentUser.picture;

    if (removePicture && picturePath) {
      try {
        const oldPath = path.join(process.cwd(), 'public', picturePath);
        await unlink(oldPath);
      } catch (e) {}
      picturePath = null;
      updates.push('picture = ?');
      values.push(null);
    }

    if (pictureFile && pictureFile.size > 0) {
      // Delete old picture if exists
      if (currentUser.picture) {
        try {
          const oldPath = path.join(process.cwd(), 'public', currentUser.picture);
          await unlink(oldPath);
        } catch (e) {}
      }

      const bytes = await pictureFile.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'users');
      await mkdir(uploadDir, { recursive: true });

      const timestamp = Date.now();
      const ext = pictureFile.name.split('.').pop();
      const filename = `user_${sessionUser.id}_${timestamp}.${ext}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      picturePath = `/uploads/users/${filename}`;
      
      updates.push('picture = ?');
      values.push(picturePath);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    values.push(sessionUser.id);

    await pool.execute(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedRows] = await pool.execute(
      `SELECT id, name, username, email, role, is_active, is_blocked, created_at, picture
       FROM users WHERE id = ?`,
      [sessionUser.id]
    );
    const updated = (updatedRows as any[])[0];

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      user: updated,
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
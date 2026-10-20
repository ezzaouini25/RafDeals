import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifySessionToken } from '@/lib/admin-auth';
import { cookies } from 'next/headers';
import { writeFile, mkdir, unlink } from 'fs/promises';
import path from 'path';

// ============================================================
// GET - Fetch all authors with article & offer counts
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];

    if (search) {
      whereClause += ' AND (a.name LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm);
    }

    // ✅ Get authors with bio, article_count and offer_count
    const [authors] = await pool.execute(
      `SELECT 
        a.id, 
        a.name, 
        a.picture, 
        a.bio,
        a.is_active, 
        a.created_at, 
        a.updated_at,
        (SELECT COUNT(*) FROM articles WHERE author_id = a.id AND is_active = 1) as article_count,
        (SELECT COUNT(*) FROM offers WHERE author_id = a.id AND is_active = 1) as offer_count
       FROM authors a
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    let totalWhereClause = 'WHERE 1=1';
    const totalParams: any[] = [];
    
    if (search) {
      totalWhereClause += ' AND (name LIKE ?)';
      totalParams.push(`%${search}%`);
    }

    const [totalResult] = await pool.execute(
      `SELECT COUNT(*) as total FROM authors ${totalWhereClause}`,
      totalParams
    );

    return NextResponse.json({
      authors,
      total: (totalResult as any[])[0]?.total || 0,
      totalPages: Math.ceil(((totalResult as any[])[0]?.total || 0) / limit),
      page,
    });

  } catch (error) {
    console.error('Error fetching authors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch authors' },
      { status: 500 }
    );
  }
}

// ============================================================
// POST - Create new author (WITH BIO)
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string || null;
    const isActive = formData.get('is_active') === 'true' || formData.get('is_active') === '1';
    const picture = formData.get('picture') as File | null;

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    let picturePath = null;

    if (picture && picture.size > 0) {
      const bytes = await picture.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'authors');
      await mkdir(uploadDir, { recursive: true });

      const timestamp = Date.now();
      const ext = picture.name.split('.').pop();
      const filename = `author_${timestamp}.${ext}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      picturePath = `/uploads/authors/${filename}`;
    }

    const [result] = await pool.execute(
      'INSERT INTO authors (name, picture, bio, is_active) VALUES (?, ?, ?, ?)',
      [name.trim(), picturePath, bio, isActive ? 1 : 0]
    );

    return NextResponse.json({
      success: true,
      id: (result as any).insertId,
      message: 'Author created successfully'
    });

  } catch (error) {
    console.error('Error creating author:', error);
    return NextResponse.json(
      { error: 'Failed to create author' },
      { status: 500 }
    );
  }
}

// ============================================================
// PUT - Update author (WITH BIO)
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get('id') || '0');

    if (isNaN(id) || id === 0) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string || null;
    const isActive = formData.get('is_active') === 'true' || formData.get('is_active') === '1';
    const picture = formData.get('picture') as File | null;
    const removePicture = formData.get('remove_picture') === 'true';

    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    // Get current author
    const [currentRows] = await pool.execute(
      'SELECT picture, bio FROM authors WHERE id = ?',
      [id]
    );
    const currentAuthor = (currentRows as any[])[0];
    if (!currentAuthor) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    let picturePath = currentAuthor.picture;

    if (removePicture && picturePath) {
      const oldPath = path.join(process.cwd(), 'public', picturePath);
      try {
        await unlink(oldPath);
      } catch (e) {}
      picturePath = null;
    }

    if (picture && picture.size > 0) {
      if (currentAuthor.picture) {
        const oldPath = path.join(process.cwd(), 'public', currentAuthor.picture);
        try {
          await unlink(oldPath);
        } catch (e) {}
      }

      const bytes = await picture.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'authors');
      await mkdir(uploadDir, { recursive: true });

      const timestamp = Date.now();
      const ext = picture.name.split('.').pop();
      const filename = `author_${timestamp}.${ext}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      picturePath = `/uploads/authors/${filename}`;
    }

    // ✅ Update with bio
    await pool.execute(
      'UPDATE authors SET name = ?, picture = ?, bio = ?, is_active = ? WHERE id = ?',
      [name.trim(), picturePath, bio, isActive ? 1 : 0, id]
    );

    return NextResponse.json({
      success: true,
      message: 'Author updated successfully'
    });

  } catch (error) {
    console.error('Error updating author:', error);
    return NextResponse.json(
      { error: 'Failed to update author' },
      { status: 500 }
    );
  }
}

// ============================================================
// DELETE - Delete author
// ============================================================
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get('id') || '0');

    if (isNaN(id) || id === 0) {
      return NextResponse.json(
        { error: 'Invalid ID' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      'SELECT picture FROM authors WHERE id = ?',
      [id]
    );
    const author = (rows as any[])[0];
    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    if (author.picture) {
      const filePath = path.join(process.cwd(), 'public', author.picture);
      try {
        await unlink(filePath);
      } catch (e) {}
    }

    await pool.execute('DELETE FROM authors WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Author deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting author:', error);
    return NextResponse.json(
      { error: 'Failed to delete author' },
      { status: 500 }
    );
  }
}
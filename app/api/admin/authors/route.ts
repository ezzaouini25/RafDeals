import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifySessionToken } from '@/lib/admin-auth';
import { cookies } from 'next/headers';
import { put, del } from '@vercel/blob';

// ============================================================
// GET - Fetch all authors with article, offer, and deal counts
// ============================================================
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
        (SELECT COUNT(*) FROM offers WHERE author_id = a.id AND is_active = 1) as offer_count,
        (SELECT COUNT(*) FROM deals WHERE author_id = a.id AND is_active = 1) as deal_count
       FROM authors a
       ${whereClause}
       ORDER BY a.created_at DESC
       LIMIT ${Number(limit)} OFFSET ${Number(offset)}`,
      params
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
    return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
  }
}

// ============================================================
// POST - Create new author
// ============================================================
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string || null;
    const isActive = formData.get('is_active') === 'true' || formData.get('is_active') === '1';
    const picture = formData.get('picture') as File | null;

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    let picturePath: string | null = null;

    if (picture && picture.size > 0) {
      if (picture.size > 4 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image too large. Max 4MB allowed.' }, { status: 400 });
      }

      const bytes = await picture.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const ext = picture.name.split('.').pop();
      const filename = `author_${timestamp}.${ext}`;

      // ✅ Upload to Vercel Blob
      await put(`uploads/authors/${filename}`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: picture.type || 'application/octet-stream',
      });

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
    return NextResponse.json({ error: 'Failed to create author' }, { status: 500 });
  }
}

// ============================================================
// PUT - Update author
// ============================================================
export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get('id') || '0');

    if (isNaN(id) || id === 0) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const formData = await request.formData();
    const name = formData.get('name') as string;
    const bio = formData.get('bio') as string || null;
    const isActive = formData.get('is_active') === 'true' || formData.get('is_active') === '1';
    const picture = formData.get('picture') as File | null;
    const removePicture = formData.get('remove_picture') === 'true';

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const [currentRows] = await pool.execute(
      'SELECT picture, bio FROM authors WHERE id = ?',
      [id]
    );
    const currentAuthor = (currentRows as any[])[0];
    if (!currentAuthor) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    let picturePath = currentAuthor.picture;

    // Remove the old picture from Blob
    if (removePicture && picturePath) {
      await deleteBlobFromPath(picturePath);
      picturePath = null;
    }

    if (picture && picture.size > 0) {
      if (picture.size > 4 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image too large. Max 4MB allowed.' }, { status: 400 });
      }

      // Delete existing picture from Blob before uploading new one
      if (currentAuthor.picture) {
        await deleteBlobFromPath(currentAuthor.picture);
      }

      const bytes = await picture.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const ext = picture.name.split('.').pop();
      const filename = `author_${timestamp}.${ext}`;

      await put(`uploads/authors/${filename}`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: picture.type || 'application/octet-stream',
      });

      picturePath = `/uploads/authors/${filename}`;
    }

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
    return NextResponse.json({ error: 'Failed to update author' }, { status: 500 });
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await verifySessionToken(token);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = parseInt(searchParams.get('id') || '0');

    if (isNaN(id) || id === 0) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
    }

    const [rows] = await pool.execute(
      'SELECT picture FROM authors WHERE id = ?',
      [id]
    );
    const author = (rows as any[])[0];
    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Delete the picture from Blob
    if (author.picture) {
      await deleteBlobFromPath(author.picture);
    }

    await pool.execute('DELETE FROM authors WHERE id = ?', [id]);

    return NextResponse.json({
      success: true,
      message: 'Author deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting author:', error);
    return NextResponse.json({ error: 'Failed to delete author' }, { status: 500 });
  }
}

// ============================================================
// Helper — delete a Blob from a local-looking DB path
// ============================================================
async function deleteBlobFromPath(localPath: string) {
  if (!localPath) return;
  const storeHost = process.env.BLOB_STORE_HOST;
  if (!storeHost) {
    console.warn('⚠️ BLOB_STORE_HOST not set, skipping delete');
    return;
  }
  try {
    const cleanPath = localPath.startsWith('/') ? localPath : `/${localPath}`;
    const blobUrl = `https://${storeHost}${cleanPath}`;
    await del(blobUrl);
    console.log(`✅ Deleted blob: ${blobUrl}`);
  } catch (e) {
    console.warn(`⚠️ Could not delete blob: ${localPath}`, e);
  }
}
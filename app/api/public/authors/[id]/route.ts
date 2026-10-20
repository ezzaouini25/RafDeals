import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idStr } = await params;
    const id = parseInt(idStr);    
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid author ID' },
        { status: 400 }
      );
    }

    const [rows] = await pool.execute(
      'SELECT id, name, picture, bio, created_at FROM authors WHERE id = ? AND is_active = 1',
      [id]
    );

    const author = (rows as any[])[0] || null;

    if (!author) {
      return NextResponse.json(
        { error: 'Author not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ author });
  } catch (error) {
    console.error('Error fetching author:', error);
    return NextResponse.json(
      { error: 'Failed to fetch author' },
      { status: 500 }
    );
  }
}
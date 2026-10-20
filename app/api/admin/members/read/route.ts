import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    await pool.execute(
      'UPDATE comments_testimonials SET is_read = 1 WHERE id = ?',
      [id]
    );

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error marking as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { type, id } = await request.json();

    let tableName = '';

    switch (type) {
      case 'comment':
      case 'testimonial':
      case 'review':
        tableName = 'comments_testimonials';
        break;
      case 'contact':
        tableName = 'contact_messages';
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    await pool.execute(
      `UPDATE ${tableName} SET is_read = 1 WHERE id = ?`,
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
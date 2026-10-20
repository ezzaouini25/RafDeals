import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { type, id, action } = await request.json();

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
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    }

    if (action === 'delete') {
      await pool.execute(`DELETE FROM ${tableName} WHERE id = ?`, [id]);
    } else if (action === 'approve') {
      await pool.execute(`UPDATE ${tableName} SET is_approved = 1 WHERE id = ?`, [id]);
    } else if (action === 'disapprove') {
      await pool.execute(`UPDATE ${tableName} SET is_approved = 0 WHERE id = ?`, [id]);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Action error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
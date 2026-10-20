import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json(
        { error: 'Slug is required' },
        { status: 400 }
      );
    }

    // ============================================================
    // 1. GET DEAL ID FROM SLUG
    // ============================================================
    const [rows] = await pool.execute(
      'SELECT id FROM deals WHERE slug = ?',
      [slug]
    );

    const deal = (rows as any[])[0];
    if (!deal) {
      return NextResponse.json(
        { error: 'Deal not found' },
        { status: 404 }
      );
    }

    const dealId = deal.id;

    // ============================================================
    // 2. UPDATE CLICKS IN DEALS TABLE
    // ============================================================
    await pool.execute(
      'UPDATE deals SET clicks = clicks + 1 WHERE id = ?',
      [dealId]
    );

    // ============================================================
    // 3. INSERT OR UPDATE ANALYTICS
    //    Check if record exists for today
    //    If yes: update clicks + 1
    //    If no: insert new record with clicks = 1
    // ============================================================
    await pool.execute(
      `INSERT INTO analytics (content_id, type, views, clicks, date)
       VALUES (?, 'deal', 0, 1, CURDATE())
       ON DUPLICATE KEY UPDATE clicks = clicks + 1`,
      [dealId]
    );

    return NextResponse.json({ 
      success: true,
      message: 'Deal click tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking deal click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
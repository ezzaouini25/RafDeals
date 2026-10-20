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
    // 1. GET OFFER ID FROM SLUG
    // ============================================================
    const [rows] = await pool.execute(
      'SELECT id FROM offers WHERE slug = ?',
      [slug]
    );

    const offer = (rows as any[])[0];
    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    const offerId = offer.id;

    // ============================================================
    // 2. UPDATE CLICKS IN OFFERS TABLE
    // ============================================================
    await pool.execute(
      'UPDATE offers SET clicks = clicks + 1 WHERE id = ?',
      [offerId]
    );

    // ============================================================
    // 3. INSERT OR UPDATE ANALYTICS
    //    Check if record exists for today
    //    If yes: update clicks + 1
    //    If no: insert new record with clicks = 1
    // ============================================================
    await pool.execute(
      `INSERT INTO analytics (content_id, type, views, clicks, date)
       VALUES (?, 'offer', 0, 1, CURDATE())
       ON DUPLICATE KEY UPDATE clicks = clicks + 1`,
      [offerId]
    );

    return NextResponse.json({ 
      success: true,
      message: 'Click tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking offer click:', error);
    return NextResponse.json(
      { error: 'Failed to track click' },
      { status: 500 }
    );
  }
}
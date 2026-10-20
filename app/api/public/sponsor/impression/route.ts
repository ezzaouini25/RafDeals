import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { sponsorId, placement } = await request.json();

    if (!sponsorId) {
      return NextResponse.json(
        { error: 'Sponsor ID is required' },
        { status: 400 }
      );
    }

    await pool.execute(
      'UPDATE sponsors SET impressions = impressions + 1 WHERE id = ?',
      [sponsorId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking impression:', error);
    return NextResponse.json(
      { error: 'Failed to track impression' },
      { status: 500 }
    );
  }
}
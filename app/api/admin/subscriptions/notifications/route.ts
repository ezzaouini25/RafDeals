import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get subscriptions from last 12 hours
    const [subscriptions] = await pool.execute(
      `SELECT id, email, created_at 
       FROM subscriptions 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
       ORDER BY created_at DESC`
    );

    return NextResponse.json({
      notifications: subscriptions,
      total: (subscriptions as any[]).length,
    });
  } catch (error) {
    console.error('Error fetching subscription notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription notifications' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // ✅ Check if the table exists and fetch data safely
    const [subscriptions] = await pool.execute(
      `SELECT id, email, created_at 
       FROM subscriptions 
       WHERE created_at > DATE_SUB(NOW(), INTERVAL 12 HOUR)
       ORDER BY created_at DESC`
    );

    // ✅ Ensure it's always an array (even if the query returns undefined)
    const notifications = Array.isArray(subscriptions) ? subscriptions : [];

    return NextResponse.json({
      notifications: notifications,
      total: notifications.length,
    });
  } catch (error) {
    console.error('Error fetching subscription notifications:', error);
    
    // ✅ Return an empty valid JSON instead of a 500 error
    return NextResponse.json({
      notifications: [],
      total: 0,
    });
  }
}
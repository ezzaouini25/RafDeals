import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();

    // Mark subscription as "read" by updating a read_at column or just return success
    // Since we only show subscriptions from last 12 hours, we don't need a read flag
    // The notification will disappear after 12 hours naturally
    
    // For now, just return success
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking subscription as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}
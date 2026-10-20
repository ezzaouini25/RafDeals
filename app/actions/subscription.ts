'use server';

import { headers } from 'next/headers';
import pool from '@/lib/db';
import { checkBlockStatus } from '@/lib/queries';
import { revalidatePath } from 'next/cache';

// ============================================================
// Check if user is blocked from subscribing
// ============================================================
export async function checkSubscriptionBlock(device_fingerprint: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    const [rows] = await pool.execute(
      `SELECT blocked_until, reason 
       FROM rate_limit_blocks 
       WHERE (ip_address = ? OR device_fingerprint = ?) 
         AND blocked_until > NOW() 
         AND reason LIKE 'Subscription limit%'
       ORDER BY blocked_until DESC 
       LIMIT 1`,
      [ip, device_fingerprint]
    );

    const block = (rows as any[])[0];

    if (block) {
      const remainingSeconds = Math.floor((new Date(block.blocked_until).getTime() - Date.now()) / 1000);
      return {
        blocked: true,
        blocked_until: block.blocked_until,
        remaining_seconds: Math.max(0, remainingSeconds),
        reason: block.reason
      };
    }

    return { blocked: false };

  } catch (error) {
    console.error('Error checking subscription block:', error);
    return { blocked: false };
  }
}

// ============================================================
// Subscribe to newsletter
// ============================================================
export async function subscribeNewsletter(email: string, device_fingerprint: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // 1. Check if blocked
    const blockStatus = await checkSubscriptionBlock(device_fingerprint);
    if (blockStatus.blocked) {
      return {
        success: false,
        blocked: true,
        error: 'You are blocked from subscribing for 24 hours.',
        remaining_seconds: blockStatus.remaining_seconds
      };
    }

    // 2. Check if email already exists
    const [existing] = await pool.execute(
      'SELECT id FROM subscriptions WHERE email = ?',
      [email.trim().toLowerCase()]
    );

    if ((existing as any[]).length > 0) {
      return {
        success: false,
        duplicate: true,
        error: 'This email is already subscribed.'
      };
    }

    // 3. Insert subscription (trigger handles rate limiting)
    await pool.execute(
      `INSERT INTO subscriptions 
       (email, ip_address, device_fingerprint) 
       VALUES (?, ?, ?)`,
      [email.trim().toLowerCase(), ip, device_fingerprint]
    );

    revalidatePath('/');

    return {
      success: true,
      message: 'You have been subscribed successfully!'
    };

  } catch (error: any) {
    console.error('Error subscribing:', error);

    // Check if it's a trigger error
    if (error.message && error.message.includes('SPAM_BLOCKED')) {
      return {
        success: false,
        blocked: true,
        error: 'You have been blocked from subscribing for 24 hours.',
        remaining_seconds: 86400
      };
    }

    if (error.message && error.message.includes('DUPLICATE_EMAIL')) {
      return {
        success: false,
        duplicate: true,
        error: 'This email is already subscribed.'
      };
    }

    return {
      success: false,
      error: error.message || 'Failed to subscribe. Please try again.'
    };
  }
}
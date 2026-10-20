'use server';

import { headers } from 'next/headers';
import pool from '@/lib/db';
import { checkBlockStatus } from '@/lib/queries';
import { revalidatePath } from 'next/cache';

// ============================================================
// FUNCTION: Check if user is blocked (called from client)
// ============================================================
export async function checkUserBlocked(device_fingerprint: string) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    return await checkBlockStatus(ip, device_fingerprint);
  } catch (error) {
    console.error('Error checking block status:', error);
    return { blocked: false };
  }
}

// ============================================================
// FUNCTION: Submit Review (offers OR deals)
// ============================================================
export async function submitReview(formData: FormData) {
  try {
    const rawOfferId = formData.get('offerId');
    const rawDealId = formData.get('dealId');
    const author_name = formData.get('author_name') as string;
    const author_email = formData.get('author_email') as string;
    const content = formData.get('content') as string;
    const rating = Number(formData.get('rating'));
    const device_fingerprint = formData.get('device_fingerprint') as string;

    const offerId = rawOfferId ? Number(rawOfferId) : null;
    const dealId = rawDealId ? Number(rawDealId) : null;

    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // Check if already blocked
    const blockStatus = await checkBlockStatus(ip, device_fingerprint);

    if (blockStatus.blocked) {
      return {
        success: false,
        blocked: true,
        error: 'You are blocked. Please wait.',
        remaining_seconds: blockStatus.remaining_seconds
      };
    }

    // Validation — need EITHER offerId OR dealId
    if ((!offerId && !dealId) || !author_name || !author_email || !content) {
      return { success: false, error: 'All fields are required' };
    }

    if (author_name.length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' };
    }

    if (!author_email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    if (content.length < 10) {
      return { success: false, error: 'Review must be at least 10 characters' };
    }

    // ============================================================
    // INSERT — offer review OR deal review
    // ============================================================
    if (offerId) {
      await pool.execute(
        `INSERT INTO comments_testimonials 
         (offer_id, type, author_name, author_email, content, rating, ip_address, device_fingerprint) 
         VALUES (?, 'review', ?, ?, ?, ?, ?, ?)`,
        [offerId, author_name.trim(), author_email.trim(), content.trim(), rating || null, ip, device_fingerprint]
      );

      // Update offer average rating
      const [avgRating] = await pool.execute(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as total 
         FROM comments_testimonials 
         WHERE offer_id = ? AND type = 'review' AND rating IS NOT NULL AND is_approved = 1`,
        [offerId]
      );

      const avg = (avgRating as any[])[0];
      if (avg && avg.total > 0) {
        await pool.execute(
          'UPDATE offers SET rating = ? WHERE id = ?',
          [Math.round(avg.avg_rating * 10) / 10, offerId]
        );
      }
    } else if (dealId) {
      await pool.execute(
        `INSERT INTO comments_testimonials 
         (deal_id, type, author_name, author_email, content, rating, ip_address, device_fingerprint) 
         VALUES (?, 'review', ?, ?, ?, ?, ?, ?)`,
        [dealId, author_name.trim(), author_email.trim(), content.trim(), rating || null, ip, device_fingerprint]
      );

      // Update deal average rating
      const [avgRating] = await pool.execute(
        `SELECT AVG(rating) as avg_rating, COUNT(*) as total 
         FROM comments_testimonials 
         WHERE deal_id = ? AND type = 'review' AND rating IS NOT NULL AND is_approved = 1`,
        [dealId]
      );

      const avg = (avgRating as any[])[0];
      if (avg && avg.total > 0) {
        await pool.execute(
          'UPDATE deals SET rating = ? WHERE id = ?',
          [Math.round(avg.avg_rating * 10) / 10, dealId]
        );
      }
    }

    // Revalidate
    if (offerId) {
      revalidatePath(`/offers/${offerId}`);
      revalidatePath('/offers');
    }
    if (dealId) {
      revalidatePath(`/deals/${dealId}`);
      revalidatePath('/deals');
    }

    return { success: true };

  } catch (error: any) {
    console.error('Error submitting review:', error);

    if (error.message && error.message.includes('SPAM_BLOCKED')) {
      return {
        success: false,
        blocked: true,
        error: 'You have been blocked for 24 hours due to excessive submissions.',
        remaining_seconds: 86400
      };
    }

    return { success: false, error: error.message || 'Failed to submit review' };
  }
}
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
// FUNCTION: Submit Comment
// ============================================================
export async function submitComment(
  articleSlug: string,
  author_name: string,
  content: string,
  author_email: string,
  device_fingerprint: string
) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    // Check if blocked
    const blockStatus = await checkBlockStatus(ip, device_fingerprint);
    if (blockStatus.blocked) {
      return {
        success: false,
        blocked: true,
        error: 'You are blocked. Please wait.',
        remaining_seconds: blockStatus.remaining_seconds
      };
    }

    // Validation
    if (!author_name || !author_email || !content) {
      return { success: false, error: 'All fields are required' };
    }

    if (author_name.length < 2) {
      return { success: false, error: 'Name must be at least 2 characters' };
    }

    if (!author_email.includes('@')) {
      return { success: false, error: 'Please enter a valid email address' };
    }

    if (content.length < 10) {
      return { success: false, error: 'Comment must be at least 10 characters' };
    }

    // Get article ID from slug
    const [articleRows] = await pool.execute(
      'SELECT id FROM articles WHERE slug = ?',
      [articleSlug]
    );
    const articles = articleRows as any[];
    if (articles.length === 0) {
      return { success: false, error: 'Article not found' };
    }
    const articleId = articles[0].id;

    // Insert comment with is_approved = 1
    await pool.execute(
      `INSERT INTO comments_testimonials 
       (article_id, type, author_name, author_email, content, ip_address, device_fingerprint, is_approved) 
       VALUES (?, 'comment', ?, ?, ?, ?, ?, 1)`,
      [articleId, author_name.trim(), author_email.trim(), content.trim(), ip, device_fingerprint]
    );

    revalidatePath(`/blog/${articleSlug}`);
    revalidatePath('/blog');

    return { success: true };

  } catch (error: any) {
    console.error('Error submitting comment:', error);

    if (error.message && error.message.includes('SPAM_BLOCKED')) {
      return {
        success: false,
        blocked: true,
        error: 'You have been blocked for 24 hours due to excessive submissions.',
        remaining_seconds: 86400
      };
    }

    return { success: false, error: error.message || 'Failed to submit comment' };
  }
}
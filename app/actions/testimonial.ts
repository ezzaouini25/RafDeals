'use server';

import { headers } from 'next/headers';
import pool from '@/lib/db';
import { checkBlockStatus } from '@/lib/queries';
import { revalidatePath } from 'next/cache';
import { put } from '@vercel/blob';
import path from 'path';

export async function getTestimonials() {
  try {
    const [rows] = await pool.execute(
      `SELECT 
        id, 
        author_name, 
        gender,
        occupation, 
        content, 
        rating, 
        payout_amount, 
        payout_type,
        image_path, 
        created_at 
       FROM comments_testimonials 
       WHERE type = 'testimonial' 
         AND is_approved = 1 
       ORDER BY created_at DESC 
       LIMIT 50`
    );
    return rows as any[];
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    return [];
  }
}

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

export async function submitTestimonial(formData: FormData) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';

    const name = formData.get('name') as string;
    const gender = formData.get('gender') as string;
    const occupation = formData.get('occupation') as string;
    const rating = Number(formData.get('rating'));
    const message = formData.get('message') as string;
    const payoutAmount = formData.get('payoutAmount') as string;
    const payoutType = formData.get('payoutType') as string;
    const device_fingerprint = formData.get('device_fingerprint') as string;
    const proofImage = formData.get('proofImage') as File | null;

    const blockStatus = await checkBlockStatus(ip, device_fingerprint);
    if (blockStatus.blocked) {
      return {
        success: false,
        blocked: true,
        error: 'You are blocked. Please wait.',
        remaining_seconds: blockStatus.remaining_seconds
      };
    }

    if (!name || !gender || !occupation || !message || !payoutAmount || !payoutType) {
      return { success: false, error: 'All fields are required' };
    }

    let imagePath = null;

    if (proofImage && proofImage.size > 0) {
      // Size guard — Vercel functions cap request bodies at 4.5 MB
      if (proofImage.size > 4 * 1024 * 1024) {
        return { success: false, error: 'Image too large. Max 4MB allowed.' };
      }

      const bytes = await proofImage.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const timestamp = Date.now();
      const ext = path.extname(proofImage.name);
      const filename = `testimonial_${timestamp}_${name.replace(/\s/g, '_')}${ext}`;

      // ✅ Upload to Vercel Blob instead of writing to /public/uploads
      const blob = await put(`uploads/testimonials/${filename}`, buffer, {
        access: 'public',
        addRandomSuffix: false,
        contentType: proofImage.type || 'application/octet-stream',
      });

      console.log('✅ Testimonial image uploaded to Blob:', blob.url);

      // Keep the same local-looking path — the rewrite in next.config.js maps it to Blob
      imagePath = `/uploads/testimonials/${filename}`;
    }

    await pool.execute(
      `INSERT INTO comments_testimonials 
       (type, author_name, gender, occupation, content, rating, payout_amount, payout_type, image_path, ip_address, device_fingerprint, is_approved) 
       VALUES ('testimonial', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [name.trim(), gender, occupation.trim(), message.trim(), rating, payoutAmount.trim(), payoutType.trim(), imagePath, ip, device_fingerprint]
    );

    revalidatePath('/');
    revalidatePath('/testimonials');

    return {
      success: true,
      message: 'Your testimonial has been submitted successfully! It will appear after review.'
    };

  } catch (error: any) {
    console.error('Error submitting testimonial:', error);

    if (error.message && error.message.includes('SPAM_BLOCKED')) {
      return {
        success: false,
        blocked: true,
        error: 'You have been blocked for 24 hours due to excessive submissions.',
        remaining_seconds: 86400
      };
    }

    return { success: false, error: error.message || 'Failed to submit testimonial' };
  }
}
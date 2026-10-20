'use server';

import { headers } from 'next/headers';
import pool from '@/lib/db';
import { contactSchema } from '@/lib/validators';
import { checkBlockStatus } from '@/lib/queries';
import { revalidatePath } from 'next/cache';

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

export async function submitContactForm(prevState: any, formData: FormData) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const device_fingerprint = formData.get('device_fingerprint') as string;

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

    // Validate form data
    const rawData = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    };

    const validation = contactSchema.safeParse(rawData);
    if (!validation.success) {
      const errors: Record<string, string[]> = {};
      validation.error.issues.forEach((err) => {
        if (err.path[0]) {
          const key = err.path[0] as string;
          if (!errors[key]) errors[key] = [];
          errors[key].push(err.message);
        }
      });
      return { success: false, errors };
    }

    // Insert contact message with IP and fingerprint
    await pool.execute(
      `INSERT INTO contact_messages 
       (name, email, subject, message, ip_address, device_fingerprint) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [rawData.name, rawData.email, rawData.subject, rawData.message, ip, device_fingerprint]
    );

    revalidatePath('/contact');
    return { success: true };
  } catch (error: any) {
    console.error('Error submitting contact form:', error);

    if (error.message && error.message.includes('SPAM_BLOCKED')) {
      return {
        success: false,
        blocked: true,
        error: 'You have been blocked for 24 hours due to excessive submissions.',
        remaining_seconds: 86400
      };
    }

    return {
      success: false,
      errors: { _form: ['An unexpected error occurred. Please try again later.'] }
    };
  }
}
'use server';

import pool from '@/lib/db';

export async function saveCookieConsent(choice: 'accepted' | 'rejected', userAgent?: string) {
  try {
    const consentId = 'consent_' + Math.random().toString(36).substring(2, 15);
    const ipAddress = '127.0.0.1'; // Simple client-side indicator or mock ip
    const ua = userAgent || 'Unknown';
    
    await pool.execute(
      'INSERT INTO cookie_consents (consent_id, choice, ip_address, user_agent) VALUES (?, ?, ?, ?)',
      [consentId, choice, ipAddress, ua]
    );
    
    return { success: true, consentId };
  } catch (error) {
    console.error('Failed to save cookie consent:', error);
    return { success: false, error: 'Database insertion error' };
  }
}

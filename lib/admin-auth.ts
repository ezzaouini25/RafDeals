import crypto from 'crypto';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-to-a-secure-secret-key';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export interface AdminSessionUser {
  id: number;
  name: string;
  username: string;
  email: string;
  role: 'admin' | 'editor';
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(SESSION_SECRET).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  if (!text || !text.includes(':')) {
    return '';
  }
  
  const parts = text.split(':');
  if (parts.length !== 2) {
    return '';
  }
  
  try {
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = parts[1];
    
    if (iv.length !== 16) {
      return '';
    }
    
    const key = crypto.createHash('sha256').update(SESSION_SECRET).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

export function createSessionToken(user: AdminSessionUser): string {
  const payload = {
    user,
    exp: Date.now() + SESSION_EXPIRY, // ✅ Expiration timestamp
  };
  return encrypt(JSON.stringify(payload));
}

export function verifySessionToken(token: string): AdminSessionUser | null {
  if (!token) {
    return null;
  }
  
  try {
    const decrypted = decrypt(token);
    if (!decrypted) {
      return null;
    }
    
    const payload = JSON.parse(decrypted);
    
    // ✅ Check if session has expired
    if (payload.exp && payload.exp < Date.now()) {
      console.log('⏰ Session expired');
      return null;
    }
    
    return payload.user;
  } catch (error) {
    console.error('Session verification failed:', error);
    return null;
  }
}

// ============================================================
// requireAdminSession — used by API routes
// ============================================================
// Returns either:
//   { ok: true,  user: AdminSessionUser }               — auth passed
//   { ok: false, response: NextResponse }               — auth failed; return this from the route
//
// Usage in an API route:
//   const auth = await requireAdminSession();
//   if (!auth.ok) return auth.response;
//   // ... use auth.user ...
//
export async function requireAdminSession(_requiredRole?: 'admin' | 'editor'): Promise<
  | { ok: true; user: AdminSessionUser }
  | { ok: false; response: NextResponse }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;

  if (!token) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const user = verifySessionToken(token);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true, user };
}
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { dbGetUserByIdentifier } from '@/lib/admin-db';
import { createSessionToken } from '@/lib/admin-auth';

// Hash password using SHA-256 (same as your user creation)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function POST(request: NextRequest) {
  try {
    const { identifier, password } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { error: 'Username/email and password are required' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await dbGetUserByIdentifier(identifier);

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check if user is blocked
    if (user.is_blocked === 1 || user.is_blocked === true) {
      return NextResponse.json(
        { 
          error: 'Your account has been suspended. Please contact support.',
          status: 'blocked' 
        },
        { status: 403 }
      );
    }

    // Check if user is inactive
    if (user.is_active === 0 || user.is_active === false) {
      return NextResponse.json(
        { 
          error: 'Your account is inactive. Please contact support.',
          status: 'inactive' 
        },
        { status: 403 }
      );
    }

    // ✅ Compare password with SHA-256 hash
    const hashedInput = hashPassword(password);
    
    if (hashedInput !== user.password) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Create session user
    const sessionUser = {
      id: user.id,
      name: user.name || user.username,
      username: user.username,
      email: user.email,
      role: user.role as 'admin' | 'editor',
      picture: user.picture ?? null, 
    };

    // Create session token
    const token = createSessionToken(sessionUser);

    if (!token) {
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });

    // ✅ Set cookie with proper options
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
      sameSite: 'lax',
    });

    console.log('✅ Login successful for:', user.username);
    return response;

  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'An error occurred during login' },
      { status: 500 }
    );
  }
}
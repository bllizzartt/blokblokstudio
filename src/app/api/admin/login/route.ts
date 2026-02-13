import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiting store
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil: number }>();

// POST /api/admin/login — authenticate admin with rate limiting
export async function POST(req: NextRequest) {
  // Clean up old entries (older than 1 hour)
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [ip, data] of loginAttempts.entries()) {
    if (data.lastAttempt < oneHourAgo) {
      loginAttempts.delete(ip);
    }
  }

  // Get client IP
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  // Get or initialize attempt data
  const attemptData = loginAttempts.get(ip) || { count: 0, lastAttempt: 0, blockedUntil: 0 };

  // Check if IP is currently blocked
  if (attemptData.blockedUntil > Date.now()) {
    const retryAfter = Math.ceil((attemptData.blockedUntil - Date.now()) / 1000);
    return NextResponse.json(
      { error: 'Too many failed attempts. Please try again later.', retryAfter },
      { status: 429 }
    );
  }

  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Check password
    if (password === process.env.ADMIN_PASSWORD) {
      // Success: reset attempt counter
      loginAttempts.delete(ip);
      return NextResponse.json({ success: true });
    } else {
      // Failure: increment count and check if should block
      attemptData.count += 1;
      attemptData.lastAttempt = Date.now();

      if (attemptData.count >= 5) {
        // Block for 15 minutes
        attemptData.blockedUntil = Date.now() + 15 * 60 * 1000;
      }

      loginAttempts.set(ip, attemptData);

      return NextResponse.json(
        { error: 'Invalid password', attemptsRemaining: Math.max(0, 5 - attemptData.count) },
        { status: 401 }
      );
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Login failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

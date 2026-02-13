import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// POST /api/admin/login — authenticate admin with persistent rate limiting
export async function POST(req: NextRequest) {
  // Get client IP
  const forwarded = req.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  // Check rate limit via database (persists across serverless invocations)
  try {
    const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Count recent failed attempts from this IP
    const recentAttempts = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      `SELECT COUNT(*) as count FROM "AuditLog"
       WHERE "action" = 'login_failed'
       AND "ipAddress" = $1
       AND "createdAt" > $2`,
      ip,
      fifteenMinAgo,
    );

    const failedCount = Number(recentAttempts[0]?.count || 0);
    if (failedCount >= 5) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.', retryAfter: 900 },
        { status: 429 }
      );
    }
  } catch {
    // If AuditLog table doesn't exist yet, skip rate limiting
  }

  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    // Timing-safe password comparison
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminPassword) {
      return NextResponse.json({ error: 'ADMIN_PASSWORD not configured' }, { status: 500 });
    }

    const passwordBuffer = Buffer.from(password);
    const adminBuffer = Buffer.from(adminPassword);
    const isValid = passwordBuffer.length === adminBuffer.length &&
      crypto.timingSafeEqual(passwordBuffer, adminBuffer);

    if (isValid) {
      // Log successful login
      try {
        await prisma.auditLog.create({
          data: { action: 'login_success', ipAddress: ip, userAgent: req.headers.get('user-agent') || undefined },
        });
      } catch { /* table might not exist */ }

      return NextResponse.json({ success: true });
    } else {
      // Log failed attempt for rate limiting
      try {
        await prisma.auditLog.create({
          data: { action: 'login_failed', ipAddress: ip, userAgent: req.headers.get('user-agent') || undefined },
        });
      } catch { /* table might not exist */ }

      // Recalculate remaining attempts
      let remaining = 4;
      try {
        const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000);
        const recentAttempts = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
          `SELECT COUNT(*) as count FROM "AuditLog"
           WHERE "action" = 'login_failed'
           AND "ipAddress" = $1
           AND "createdAt" > $2`,
          ip,
          fifteenMinAgo,
        );
        remaining = Math.max(0, 5 - Number(recentAttempts[0]?.count || 1));
      } catch { /* skip */ }

      return NextResponse.json(
        { error: 'Invalid password', attemptsRemaining: remaining },
        { status: 401 }
      );
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Login failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

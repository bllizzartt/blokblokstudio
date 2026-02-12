import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple password-based admin auth via Authorization header.
 * Usage in API routes: const authError = checkAdmin(req); if (authError) return authError;
 */
export function checkAdmin(req: NextRequest): NextResponse | null {
  const authHeader = req.headers.get('authorization');
  const password = process.env.ADMIN_PASSWORD;

  if (!password || password === 'change-this-to-a-strong-password') {
    return NextResponse.json(
      { error: 'ADMIN_PASSWORD not configured in .env' },
      { status: 500 }
    );
  }

  if (!authHeader || authHeader !== `Bearer ${password}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return null; // Auth passed
}

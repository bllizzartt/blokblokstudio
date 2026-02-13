/* ==========================================================================
 * /api/gdpr/delete — GDPR Data Deletion (Right to Erasure)
 * ==========================================================================
 *
 * PURPOSE:
 *   After a user verifies their identity via the email link, this endpoint
 *   permanently deletes all personal data associated with their email.
 *   Token is time-limited (15 minutes). Redirects to /data-rights with
 *   a success or error query param.
 *
 * METHOD: GET
 * QUERY:  ?token=<verification_token>
 *
 * ========================================================================== */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/gdpr-tokens';

export async function GET(req: NextRequest) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tryblokblokstudio.com';

  try {
    const token = req.nextUrl.searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/data-rights?status=error&reason=token_required', baseUrl));
    }

    // Verify the time-limited token
    const { valid, email } = verifyToken(token);

    if (!valid || !email) {
      return NextResponse.redirect(new URL('/data-rights?status=error&reason=expired', baseUrl));
    }

    // Delete user data
    await prisma.lead.delete({ where: { email } });

    return NextResponse.redirect(new URL('/data-rights?status=deleted', baseUrl));
  } catch (err: unknown) {
    console.error('[API /gdpr/delete] Error:', err);

    // Handle case where record doesn't exist (already deleted)
    const prismaError = err as { code?: string };
    if (prismaError.code === 'P2025') {
      return NextResponse.redirect(new URL('/data-rights?status=deleted', baseUrl));
    }

    return NextResponse.redirect(new URL('/data-rights?status=error&reason=server_error', baseUrl));
  }
}

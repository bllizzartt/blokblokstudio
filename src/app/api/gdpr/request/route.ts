/* ==========================================================================
 * /api/gdpr/request — Handle Data Export / Deletion Requests
 * ==========================================================================
 *
 * PURPOSE:
 *   Receives a request from the /data-rights page to either export or
 *   delete a user's personal data. Sends a verification email with a
 *   time-limited token link (15 min). Does not reveal whether the email
 *   exists in the system (privacy protection).
 *
 * METHOD: POST
 * BODY:   { email: string, type: 'export' | 'delete' }
 *
 * ========================================================================== */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateVerificationToken } from '@/lib/gdpr-tokens';
import { Resend } from 'resend';

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

export async function POST(req: NextRequest) {
  try {
    const { email, type } = await req.json();

    if (!email || !type || !['export', 'delete'].includes(type)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Check if user exists (don't reveal this to the client)
    const lead = await prisma.lead.findUnique({ where: { email } });

    if (!lead) {
      // Return success anyway — don't reveal if email exists or not
      return NextResponse.json({
        success: true,
        message: 'If this email exists in our system, you will receive a verification link.',
      });
    }

    // Generate a time-limited verification token
    const token = generateVerificationToken(email);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://tryblokblokstudio.com';
    const verifyUrl = `${baseUrl}/api/gdpr/${type}?token=${token}`;

    // Send verification email
    const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    await getResend().emails.send({
      from: `Blok Blok Studio <${from}>`,
      to: email,
      subject:
        type === 'export'
          ? 'Your Data Export Request — Blok Blok Studio'
          : 'Your Data Deletion Request — Blok Blok Studio',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #f97316; margin-bottom: 24px;">
            ${type === 'export' ? 'Data Export Request' : 'Data Deletion Request'}
          </h2>
          <p style="margin-bottom: 16px; color: #333;">
            You requested to ${type === 'export' ? 'export' : 'permanently delete'} your personal data from Blok Blok Studio.
          </p>
          <p style="margin-bottom: 24px; color: #333;">
            Click the button below to confirm. This link expires in <strong>15 minutes</strong>.
          </p>
          <a href="${verifyUrl}" style="display: inline-block; padding: 14px 32px; background: #f97316; color: white; text-decoration: none; border-radius: 9999px; font-weight: 600; font-size: 14px;">
            Confirm ${type === 'export' ? 'Export' : 'Deletion'}
          </a>
          <p style="margin-top: 32px; color: #999; font-size: 13px;">
            If you didn&rsquo;t make this request, you can safely ignore this email. No changes will be made.
          </p>
          <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999; margin-top: 16px;">
            Blok Blok Studio &mdash; Digital Agency for Ambitious Brands
          </p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (err) {
    console.error('[API /gdpr/request] Error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/newsletter — Handle newsletter signup.
 * Creates a lead with source "newsletter" for email collection.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Check if already subscribed
    const existing = await prisma.lead.findUnique({ where: { email } });

    if (existing) {
      // Already in system — just return success (don't reveal they're already subscribed)
      return NextResponse.json({ success: true });
    }

    await prisma.lead.create({
      data: {
        name: email.split('@')[0], // Use email prefix as name
        email,
        field: 'Newsletter',
        problem: 'Newsletter signup',
        source: 'newsletter',
        consentGiven: true,
        consentTimestamp: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Signup failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

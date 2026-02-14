import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { assignToList, NEWSLETTER_LIST } from '@/lib/auto-list';
import { notifyNewsletterSignup } from '@/lib/telegram';

// SOC 2 compliant rate limiting: 3 signups per IP per 15 minutes
const limiter = rateLimit({ interval: 15 * 60 * 1000, maxRequests: 3 });

/**
 * POST /api/newsletter — Handle newsletter signup.
 * Creates a lead with source "newsletter" for email collection.
 * Rate limited to prevent spam and abuse (SOC 2 requirement).
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const { success } = limiter.check(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

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
      // Already in system — still add to newsletter list (they might be an audit lead subscribing)
      await assignToList(existing.id, NEWSLETTER_LIST.name, NEWSLETTER_LIST.color);
      return NextResponse.json({ success: true });
    }

    const lead = await prisma.lead.create({
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

    // Auto-assign to Weekly Insights list
    await assignToList(lead.id, NEWSLETTER_LIST.name, NEWSLETTER_LIST.color);

    // Notify via Telegram (non-blocking)
    notifyNewsletterSignup(email).catch(() => {});

    return NextResponse.json({ success: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Signup failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

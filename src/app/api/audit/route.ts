import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { notifyNewLead } from '@/lib/email';
import { notifyTelegram } from '@/lib/telegram';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, field, website, noWebsite, problem, consent } = body;

    // Basic validation
    if (!name || !email || !field || !problem) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // GDPR: Consent is required
    if (!consent) {
      return NextResponse.json(
        { error: 'Consent is required' },
        { status: 400 }
      );
    }

    // Simple email format check
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Get IP address for GDPR consent tracking
    const consentIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown';

    // Upsert — if same email submits again, update their info
    const lead = await prisma.lead.upsert({
      where: { email },
      update: {
        name,
        field,
        website: noWebsite ? null : (website || null),
        noWebsite: !!noWebsite,
        problem,
        consentGiven: true,
        consentTimestamp: new Date(),
        consentIp,
      },
      create: {
        name,
        email,
        field,
        website: noWebsite ? null : (website || null),
        noWebsite: !!noWebsite,
        problem,
        source: 'funnel',
        consentGiven: true,
        consentTimestamp: new Date(),
        consentIp,
      },
    });

    // Fire notifications in parallel (non-blocking)
    const leadData = {
      name,
      email,
      field,
      website: noWebsite ? null : (website || null),
      problem,
    };

    await Promise.allSettled([
      notifyNewLead(leadData),
      notifyTelegram(leadData),
    ]);

    return NextResponse.json({ success: true, id: lead.id });
  } catch (err) {
    console.error('[API /audit] Error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

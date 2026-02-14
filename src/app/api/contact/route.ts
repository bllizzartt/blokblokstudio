import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit } from '@/lib/rate-limit';
import { assignToList, CONTACT_LIST } from '@/lib/auto-list';

// SOC 2 compliant rate limiting: 5 submissions per IP per 15 minutes
const limiter = rateLimit({ interval: 15 * 60 * 1000, maxRequests: 5 });

/**
 * POST /api/contact — Handle contact form submissions.
 * Creates a new lead from the contact form and sends a Telegram notification.
 * Rate limited to prevent spam and abuse (SOC 2 requirement).
 */
export async function POST(req: NextRequest) {
  try {
    // Rate limit by IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    const { success, remaining, resetAt } = limiter.check(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((resetAt - Date.now()) / 1000)),
            'X-RateLimit-Remaining': '0',
          },
        }
      );
    }

    const { name, email, company, message, consent } = await req.json();
    const consentIp = ip;

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    // Create or update the lead
    const existingLead = await prisma.lead.findUnique({ where: { email } });

    let leadId: string;

    if (existingLead) {
      // Update existing lead with latest contact info
      await prisma.lead.update({
        where: { email },
        data: {
          name,
          problem: message,
          website: company || existingLead.website,
          source: 'contact',
          consentGiven: consent === true,
          consentTimestamp: new Date(),
          consentIp,
        },
      });
      leadId = existingLead.id;
    } else {
      const lead = await prisma.lead.create({
        data: {
          name,
          email,
          field: company || 'Unknown',
          website: company || null,
          problem: message,
          source: 'contact',
          consentGiven: consent === true,
          consentTimestamp: new Date(),
          consentIp,
        },
      });
      leadId = lead.id;
    }

    // Auto-assign to Contact Inquiries list
    await assignToList(leadId, CONTACT_LIST.name, CONTACT_LIST.color);

    // Send Telegram notification if configured
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (botToken && chatId && botToken !== 'YOUR_BOT_TOKEN_HERE') {
      try {
        const text = `New Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nCompany: ${company || 'N/A'}\nMessage: ${message.slice(0, 500)}`;
        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
        });
      } catch { /* non-critical */ }
    }

    return NextResponse.json(
      { success: true },
      {
        headers: {
          'X-RateLimit-Remaining': String(remaining),
        },
      }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Submission failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

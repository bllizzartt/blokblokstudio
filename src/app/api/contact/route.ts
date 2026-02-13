import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * POST /api/contact — Handle contact form submissions.
 * Creates a new lead from the contact form and sends a Telegram notification.
 */
export async function POST(req: NextRequest) {
  try {
    const { name, email, company, message } = await req.json();

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Name, email, and message are required' }, { status: 400 });
    }

    // Create or update the lead
    const existingLead = await prisma.lead.findUnique({ where: { email } });

    if (existingLead) {
      // Update existing lead with latest contact info
      await prisma.lead.update({
        where: { email },
        data: {
          name,
          problem: message,
          website: company || existingLead.website,
          source: 'contact',
        },
      });
    } else {
      await prisma.lead.create({
        data: {
          name,
          email,
          field: company || 'Unknown',
          website: company || null,
          problem: message,
          source: 'contact',
        },
      });
    }

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

    return NextResponse.json({ success: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Submission failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

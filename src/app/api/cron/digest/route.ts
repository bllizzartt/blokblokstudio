import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Daily digest cron — sends a summary of activity to Telegram.
 * Can be added to vercel.json crons.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Get counts for last 24 hours
    const [newLeads, eventCounts, activeSequences, accountStats] = await Promise.all([
      prisma.lead.count({ where: { createdAt: { gte: yesterday } } }),
      prisma.emailEvent.groupBy({
        by: ['type'],
        where: { createdAt: { gte: yesterday } },
        _count: true,
      }),
      prisma.sequenceEnrollment.count({ where: { status: 'active' } }),
      prisma.sendingAccount.findMany({
        where: { active: true },
        select: { email: true, sentToday: true, dailyLimit: true },
      }),
    ]);

    const events: Record<string, number> = {};
    for (const e of eventCounts) {
      events[e.type] = e._count;
    }

    const sent = events['sent'] || 0;
    const opened = events['opened'] || 0;
    const replied = events['replied'] || 0;
    const bounced = events['bounced'] || 0;
    const openRate = sent > 0 ? ((opened / sent) * 100).toFixed(1) : '0';
    const replyRate = sent > 0 ? ((replied / sent) * 100).toFixed(1) : '0';

    const totalCapacity = accountStats.reduce((s, a) => s + a.dailyLimit, 0);
    const totalSent = accountStats.reduce((s, a) => s + a.sentToday, 0);

    // Build the message (reuse Telegram since that's what's configured)
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      return NextResponse.json({ message: 'Telegram not configured, skipping digest' });
    }

    const message = [
      '\u{1F4CA} Daily Digest \u2014 Blok Blok Admin',
      '',
      `\u{1F4C5} ${now.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
      '',
      '\u2500\u2500 Emails \u2500\u2500',
      `\u{1F4E4} Sent: ${sent}`,
      `\u{1F4EC} Opened: ${opened} (${openRate}%)`,
      `\u{1F4AC} Replied: ${replied} (${replyRate}%)`,
      `\u{1F534} Bounced: ${bounced}`,
      '',
      '\u2500\u2500 Pipeline \u2500\u2500',
      `\u{1F195} New leads: ${newLeads}`,
      `\u{1F504} Active sequences: ${activeSequences}`,
      '',
      '\u2500\u2500 Accounts \u2500\u2500',
      `\u{1F4E7} ${accountStats.length} active accounts`,
      `\u{1F4CA} Capacity used: ${totalSent}/${totalCapacity}`,
      ...accountStats.map(a => `  \u2022 ${a.email}: ${a.sentToday}/${a.dailyLimit}`),
    ].join('\n');

    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text: message }),
    });

    return NextResponse.json({ success: true, message: 'Digest sent' });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg.slice(0, 200) }, { status: 500 });
  }
}

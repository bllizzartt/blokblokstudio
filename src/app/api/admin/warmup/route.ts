import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/warmup — get warmup status for all accounts
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const accounts = await prisma.sendingAccount.findMany({
      where: { active: true },
      include: {
        warmupLogs: { orderBy: { date: 'desc' }, take: 30 },
        dailyLogs: { orderBy: { date: 'desc' }, take: 30 },
      },
    });

    const warmupData = accounts.map(account => {
      const daysSinceStart = Math.floor(
        (Date.now() - account.warmupStart.getTime()) / (1000 * 60 * 60 * 24)
      );

      const totalWarmupSent = account.warmupLogs.reduce((s, l) => s + l.sent, 0);
      const totalWarmupReceived = account.warmupLogs.reduce((s, l) => s + l.received, 0);
      const totalInbox = account.warmupLogs.reduce((s, l) => s + l.inbox, 0);
      const totalSpam = account.warmupLogs.reduce((s, l) => s + l.spam, 0);
      const inboxRate = totalWarmupSent > 0 ? Math.round((totalInbox / totalWarmupSent) * 100) : 0;

      // Calculate warmup health score
      const recentLogs = account.warmupLogs.slice(0, 7);
      const recentSent = recentLogs.reduce((s, l) => s + l.sent, 0);
      const recentInbox = recentLogs.reduce((s, l) => s + l.inbox, 0);
      const recentInboxRate = recentSent > 0 ? Math.round((recentInbox / recentSent) * 100) : 0;

      // Overall account health from sending logs
      const totalSent = account.dailyLogs.reduce((s, l) => s + l.sent, 0);
      const totalBounced = account.dailyLogs.reduce((s, l) => s + l.bounced, 0);
      const bounceRate = totalSent > 0 ? Math.round((totalBounced / totalSent) * 1000) / 10 : 0;

      return {
        id: account.id,
        email: account.email,
        label: account.label,
        warmupEnabled: account.warmupEnabled,
        warmupDaily: account.warmupDaily,
        warmupPhase: account.warmupPhase,
        dailyLimit: account.dailyLimit,
        daysSinceStart,
        sendWindowStart: account.sendWindowStart,
        sendWindowEnd: account.sendWindowEnd,
        sendWeekdays: account.sendWeekdays,
        stats: {
          totalWarmupSent,
          totalWarmupReceived,
          totalInbox,
          totalSpam,
          inboxRate,
          recentInboxRate,
          totalSent,
          totalBounced,
          bounceRate,
        },
        warmupLogs: account.warmupLogs.map(l => ({
          date: l.date,
          sent: l.sent,
          received: l.received,
          inbox: l.inbox,
          spam: l.spam,
        })),
      };
    });

    return NextResponse.json({ accounts: warmupData });
  } catch {
    return NextResponse.json({ accounts: [] });
  }
}

// PATCH /api/admin/warmup — update warmup settings for an account
export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { id, warmupEnabled, warmupDaily, sendWindowStart, sendWindowEnd, sendWeekdays } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing account id' }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof warmupEnabled === 'boolean') data.warmupEnabled = warmupEnabled;
    if (typeof warmupDaily === 'number' && warmupDaily >= 1 && warmupDaily <= 50) data.warmupDaily = warmupDaily;
    if (typeof sendWindowStart === 'number' && sendWindowStart >= 0 && sendWindowStart <= 23) data.sendWindowStart = sendWindowStart;
    if (typeof sendWindowEnd === 'number' && sendWindowEnd >= 0 && sendWindowEnd <= 23) data.sendWindowEnd = sendWindowEnd;
    if (typeof sendWeekdays === 'string') data.sendWeekdays = sendWeekdays;

    await prisma.sendingAccount.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 400 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

/**
 * GET /api/admin/analytics — time-series and campaign-level analytics
 *
 * Query params:
 *   view=leads|emails|campaigns|summary|ab
 *   range=7d|30d|90d|custom
 *   from=YYYY-MM-DD (when range=custom)
 *   to=YYYY-MM-DD   (when range=custom)
 */
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { searchParams } = req.nextUrl;
  const view = searchParams.get('view') || 'leads';
  const range = searchParams.get('range') || '30d';

  // Date range calculation — supports custom
  let since: Date;
  let until: Date = new Date();

  if (range === 'custom') {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');
    since = fromParam ? new Date(fromParam) : new Date(Date.now() - 30 * 86400000);
    until = toParam ? new Date(toParam + 'T23:59:59') : new Date();
  } else {
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    since = new Date(Date.now() - days * 86400000);
  }

  try {
    // ── Summary view: aggregate KPIs ──
    if (view === 'summary') {
      const [totalLeads, totalEvents] = await Promise.all([
        prisma.lead.count(),
        prisma.emailEvent.groupBy({
          by: ['type'],
          _count: true,
          where: { createdAt: { gte: since, lte: until } },
        }),
      ]);

      const counts: Record<string, number> = {};
      for (const e of totalEvents) counts[e.type] = e._count;

      const sent = counts.sent || 1;
      return NextResponse.json({
        totalLeads,
        totalSent: counts.sent || 0,
        totalOpened: counts.opened || 0,
        totalClicked: counts.clicked || 0,
        totalReplied: counts.replied || 0,
        totalBounced: counts.bounced || 0,
        avgOpenRate: ((counts.opened || 0) / sent * 100).toFixed(1),
        avgClickRate: ((counts.clicked || 0) / sent * 100).toFixed(1),
        avgReplyRate: ((counts.replied || 0) / sent * 100).toFixed(1),
        avgBounceRate: ((counts.bounced || 0) / sent * 100).toFixed(1),
      });
    }

    // ── Leads view: daily lead creation ──
    if (view === 'leads') {
      const leads = await prisma.lead.findMany({
        where: { createdAt: { gte: since, lte: until } },
        select: { createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

      const byDay: Record<string, number> = {};
      for (const l of leads) {
        const day = l.createdAt.toISOString().slice(0, 10);
        byDay[day] = (byDay[day] || 0) + 1;
      }

      // Fill zero-days for smooth chart
      const data = [];
      const d = new Date(since);
      while (d <= until) {
        const key = d.toISOString().slice(0, 10);
        data.push({ date: key, count: byDay[key] || 0 });
        d.setDate(d.getDate() + 1);
      }

      return NextResponse.json({ data });
    }

    // ── Emails view: daily event breakdown ──
    if (view === 'emails') {
      const events = await prisma.emailEvent.findMany({
        where: { createdAt: { gte: since, lte: until } },
        select: { createdAt: true, type: true },
        orderBy: { createdAt: 'asc' },
      });

      const byDay: Record<string, Record<string, number>> = {};
      for (const e of events) {
        const day = e.createdAt.toISOString().slice(0, 10);
        if (!byDay[day]) byDay[day] = {};
        byDay[day][e.type] = (byDay[day][e.type] || 0) + 1;
      }

      const data = [];
      const d = new Date(since);
      while (d <= until) {
        const key = d.toISOString().slice(0, 10);
        data.push({
          date: key,
          sent: byDay[key]?.sent || 0,
          opened: byDay[key]?.opened || 0,
          clicked: byDay[key]?.clicked || 0,
          replied: byDay[key]?.replied || 0,
          bounced: byDay[key]?.bounced || 0,
        });
        d.setDate(d.getDate() + 1);
      }

      return NextResponse.json({ data });
    }

    // ── Campaigns view: per-campaign performance ──
    if (view === 'campaigns') {
      const campaigns = await prisma.emailCampaign.findMany({
        where: { status: 'sent' },
        orderBy: { sentAt: 'desc' },
        take: 30,
      });

      const result = [];
      for (const c of campaigns) {
        const events = await prisma.emailEvent.groupBy({
          by: ['type'],
          where: { campaignId: c.id },
          _count: true,
        });

        const counts: Record<string, number> = {};
        for (const e of events) counts[e.type] = e._count;
        const sent = counts.sent || c.sentTo || 1;

        // Check if this campaign had A/B variants
        let hasVariants = false;
        try {
          if (c.variants) {
            const parsed = JSON.parse(c.variants as string);
            hasVariants = Array.isArray(parsed) && parsed.length >= 2;
          }
        } catch { /* ignore */ }

        result.push({
          id: c.id,
          subject: c.subject,
          sentTo: c.sentTo,
          sentAt: c.sentAt,
          openRate: ((counts.opened || 0) / sent * 100).toFixed(1),
          clickRate: ((counts.clicked || 0) / sent * 100).toFixed(1),
          replyRate: ((counts.replied || 0) / sent * 100).toFixed(1),
          bounceRate: ((counts.bounced || 0) / sent * 100).toFixed(1),
          hasVariants,
        });
      }

      return NextResponse.json({ campaigns: result });
    }

    // ── Deliverability view: snapshot data ──
    if (view === 'deliverability') {
      const snapshots = await prisma.deliverabilitySnapshot.findMany({
        where: { date: { gte: since.toISOString().slice(0, 10) } },
        orderBy: { date: 'asc' },
      });

      return NextResponse.json({
        data: snapshots.map(s => ({
          date: s.date,
          sent: s.totalSent,
          bounced: s.totalBounced,
          bounceRate: s.bounceRate,
          complaintRate: s.complaintRate,
          unsubRate: s.unsubRate,
          openRate: s.openRate,
        })),
      });
    }

    return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
  } catch (err) {
    console.error('[Analytics] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}

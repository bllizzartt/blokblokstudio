import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import {
  getDeliverabilityScore,
  getSuppressionStats,
  recordDailySnapshot,
} from '@/lib/deliverability';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/deliverability — comprehensive deliverability health report
 *
 * Returns:
 *  - score (0-100) + rating
 *  - factor breakdown (bounce rate, complaints, engagement, list hygiene, domain auth)
 *  - suppression stats (how many leads are being protected)
 *  - 30-day trend (daily snapshots)
 *  - active alerts (anything needing attention)
 */
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const [scoreData, suppressionData, snapshots] = await Promise.all([
      getDeliverabilityScore(),
      getSuppressionStats(),
      prisma.deliverabilitySnapshot.findMany({
        where: {
          date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Generate alerts based on current factors
    const alerts: { level: 'danger' | 'warning' | 'info'; message: string }[] = [];

    for (const factor of scoreData.factors) {
      if (factor.status === 'danger') {
        alerts.push({ level: 'danger', message: `${factor.name}: ${factor.detail}` });
      } else if (factor.status === 'warning') {
        alerts.push({ level: 'warning', message: `${factor.name}: ${factor.detail}` });
      }
    }

    // Check for paused campaigns
    const pausedCampaigns = await prisma.emailCampaign.count({
      where: { status: 'paused' },
    });
    if (pausedCampaigns > 0) {
      alerts.push({ level: 'warning', message: `${pausedCampaigns} campaign(s) auto-paused due to poor metrics` });
    }

    // Check soft bounce queue
    const pendingRetries = await prisma.softBounceQueue.count();
    if (pendingRetries > 0) {
      alerts.push({ level: 'info', message: `${pendingRetries} soft-bounced email(s) queued for retry` });
    }

    return NextResponse.json({
      score: scoreData.score,
      rating: scoreData.rating,
      factors: scoreData.factors,
      suppression: suppressionData,
      trend: snapshots.map(s => ({
        date: s.date,
        sent: s.totalSent,
        bounceRate: s.bounceRate,
        complaintRate: s.complaintRate,
        openRate: s.openRate,
      })),
      alerts,
    });
  } catch (err) {
    console.error('[Deliverability] Error:', err);
    return NextResponse.json({ error: 'Failed to fetch deliverability data' }, { status: 500 });
  }
}

/**
 * POST /api/admin/deliverability — actions
 *
 * Actions:
 *  - record-snapshot: Force record today's deliverability snapshot
 *  - mark-complaint: Mark lead(s) as complaint
 *  - clear-complaint: Remove complaint flag from lead
 *  - recalculate-engagement: Recalculate engagement scores for all leads
 */
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { action, leadIds, leadId } = await req.json();

    if (action === 'record-snapshot') {
      await recordDailySnapshot();
      return NextResponse.json({ success: true, message: 'Snapshot recorded' });
    }

    if (action === 'mark-complaint' && (leadIds || leadId)) {
      const ids = leadIds || [leadId];
      let updated = 0;
      for (const id of ids) {
        try {
          await prisma.lead.update({
            where: { id },
            data: { complainedAt: new Date(), complaintSource: 'manual' },
          });
          updated++;
        } catch { /* skip */ }
      }
      return NextResponse.json({ success: true, updated });
    }

    if (action === 'clear-complaint' && leadId) {
      await prisma.lead.update({
        where: { id: leadId },
        data: { complainedAt: null, complaintSource: null },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'recalculate-engagement') {
      // Get all leads with recent events
      const leads = await prisma.lead.findMany({
        select: { id: true },
      });

      let updated = 0;
      for (const lead of leads) {
        const recentEvents = await prisma.emailEvent.findMany({
          where: {
            leadId: lead.id,
            type: { in: ['opened', 'clicked', 'replied'] },
            createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
          },
          orderBy: { createdAt: 'desc' },
        });

        if (recentEvents.length === 0) continue;

        let score = 0;
        for (const event of recentEvents) {
          const daysAgo = Math.floor((Date.now() - event.createdAt.getTime()) / (1000 * 60 * 60 * 24));
          const decay = Math.max(0, 1 - daysAgo / 90); // Linear decay over 90 days
          const weight = event.type === 'replied' ? 50 : event.type === 'clicked' ? 25 : 10;
          score += weight * decay;
        }

        score = Math.min(100, Math.round(score));
        const lastEngaged = recentEvents[0].createdAt;

        await prisma.lead.update({
          where: { id: lead.id },
          data: { engagementScore: score, lastEngagedAt: lastEngaged },
        });
        updated++;
      }

      return NextResponse.json({ success: true, updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[Deliverability] Action error:', err);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}

import { prisma } from './prisma';

/**
 * Deliverability Guard — centralized email sending protection.
 *
 * Prevents blacklisting through:
 * 1. Email validity filtering (skip invalid/disposable/bounced)
 * 2. Complaint suppression (never re-email complainants)
 * 3. Engagement scoring (suppress disengaged leads)
 * 4. Global rate limiting (300/min, exponential backoff)
 * 5. Unsubscribe/complaint rate auto-pause
 * 6. SPF/DKIM/DMARC enforcement
 * 7. Soft bounce retry queue
 */

// ── Rate Limiter (in-memory, resets on deploy) ──
const rateLimiter = {
  windowStart: 0,
  count: 0,
  maxPerMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '300', 10),
  backoffUntil: 0,
  consecutiveErrors: 0,
};

/**
 * Check if we're allowed to send right now (global rate limit).
 * Returns { allowed, waitMs } — if not allowed, waitMs is how long to wait.
 */
export function checkRateLimit(): { allowed: boolean; waitMs: number } {
  const now = Date.now();

  // Backoff from ISP errors
  if (now < rateLimiter.backoffUntil) {
    return { allowed: false, waitMs: rateLimiter.backoffUntil - now };
  }

  // Reset window every 60s
  if (now - rateLimiter.windowStart >= 60_000) {
    rateLimiter.windowStart = now;
    rateLimiter.count = 0;
  }

  if (rateLimiter.count >= rateLimiter.maxPerMinute) {
    const waitMs = 60_000 - (now - rateLimiter.windowStart);
    return { allowed: false, waitMs: Math.max(waitMs, 1000) };
  }

  rateLimiter.count++;
  return { allowed: true, waitMs: 0 };
}

/**
 * Report an ISP error (4xx/5xx) to trigger exponential backoff.
 */
export function reportSendError(): void {
  rateLimiter.consecutiveErrors++;
  // Exponential backoff: 5s, 10s, 20s, 40s, max 120s
  const backoffMs = Math.min(5000 * Math.pow(2, rateLimiter.consecutiveErrors - 1), 120_000);
  rateLimiter.backoffUntil = Date.now() + backoffMs;
  console.warn(`[RateLimit] Backoff ${backoffMs / 1000}s after ${rateLimiter.consecutiveErrors} consecutive errors`);
}

/**
 * Report a successful send to reset error backoff.
 */
export function reportSendSuccess(): void {
  rateLimiter.consecutiveErrors = 0;
}

// ── Lead Eligibility Filter ──

/**
 * Check if a lead is eligible to receive an email.
 * Returns { eligible, reason } — blocks invalid, bounced, complained, disengaged.
 */
export async function isLeadEligible(leadId: string): Promise<{ eligible: boolean; reason: string }> {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    select: {
      id: true,
      email: true,
      unsubscribed: true,
      emailVerified: true,
      verifyResult: true,
      bounceCount: true,
      bounceType: true,
      complainedAt: true,
      lastEngagedAt: true,
      engagementScore: true,
      emailsSent: true,
      lastEmailAt: true,
    },
  });

  if (!lead) return { eligible: false, reason: 'Lead not found' };
  if (lead.unsubscribed) return { eligible: false, reason: 'Unsubscribed' };
  if (lead.complainedAt) return { eligible: false, reason: 'Marked as complaint' };

  // Hard bounce — never send again
  if (lead.bounceType === 'hard' || lead.bounceCount >= 3) {
    return { eligible: false, reason: `Hard bounce (${lead.bounceCount} bounces)` };
  }

  // Email verification results
  const blockedResults = ['invalid', 'disposable'];
  if (lead.verifyResult && blockedResults.includes(lead.verifyResult)) {
    return { eligible: false, reason: `Email ${lead.verifyResult}` };
  }

  // Engagement check — suppress after 60 days of no engagement (if they've received 5+ emails)
  if (lead.emailsSent >= 5 && lead.lastEngagedAt) {
    const daysSinceEngagement = Math.floor((Date.now() - new Date(lead.lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceEngagement > 60) {
      return { eligible: false, reason: `Disengaged (${daysSinceEngagement} days since last activity)` };
    }
  }

  // Frequency cap: max 1 email per 24 hours
  if (lead.lastEmailAt) {
    const hoursSinceLastEmail = (Date.now() - new Date(lead.lastEmailAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastEmail < 24) {
      return { eligible: false, reason: 'Frequency cap (24h)' };
    }
  }

  return { eligible: true, reason: 'OK' };
}

/**
 * Batch-filter leads for a campaign. Returns eligible lead IDs and skip reasons.
 */
export async function filterEligibleLeads(
  leadIds: string[]
): Promise<{ eligible: string[]; skipped: { id: string; reason: string }[] }> {
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: {
      id: true,
      unsubscribed: true,
      emailVerified: true,
      verifyResult: true,
      bounceCount: true,
      bounceType: true,
      complainedAt: true,
      lastEngagedAt: true,
      engagementScore: true,
      emailsSent: true,
      lastEmailAt: true,
    },
  });

  const eligible: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  const blockedResults = ['invalid', 'disposable'];

  for (const lead of leads) {
    if (lead.unsubscribed) {
      skipped.push({ id: lead.id, reason: 'Unsubscribed' });
    } else if (lead.complainedAt) {
      skipped.push({ id: lead.id, reason: 'Complaint suppressed' });
    } else if (lead.bounceType === 'hard' || lead.bounceCount >= 3) {
      skipped.push({ id: lead.id, reason: 'Hard bounce' });
    } else if (lead.verifyResult && blockedResults.includes(lead.verifyResult)) {
      skipped.push({ id: lead.id, reason: `Email ${lead.verifyResult}` });
    } else if (lead.emailsSent >= 5 && lead.lastEngagedAt) {
      const days = Math.floor((Date.now() - new Date(lead.lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24));
      if (days > 60) {
        skipped.push({ id: lead.id, reason: 'Disengaged 60+ days' });
      } else {
        eligible.push(lead.id);
      }
    } else {
      eligible.push(lead.id);
    }
  }

  return { eligible, skipped };
}

// ── Campaign Health Monitor ──

/**
 * Check campaign health metrics and auto-pause if thresholds exceeded.
 * Returns { shouldPause, reason, metrics }
 */
export async function checkCampaignHealth(campaignId: string): Promise<{
  shouldPause: boolean;
  reason: string;
  metrics: { bounceRate: number; unsubRate: number; complaintRate: number };
}> {
  const campaign = await prisma.emailCampaign.findUnique({
    where: { id: campaignId },
  });

  if (!campaign || campaign.status !== 'sending') {
    return { shouldPause: false, reason: '', metrics: { bounceRate: 0, unsubRate: 0, complaintRate: 0 } };
  }

  const events = await prisma.emailEvent.groupBy({
    by: ['type'],
    where: { campaignId },
    _count: true,
  });

  const counts: Record<string, number> = {};
  for (const e of events) counts[e.type] = e._count;

  const sent = counts.sent || campaign.sentTo || 1;
  const bounceRate = ((counts.bounced || 0) / sent) * 100;
  const unsubRate = ((counts.unsubscribed || 0) / sent) * 100;
  const complaintRate = ((counts.complained || 0) / sent) * 100;

  const maxBounceRate = parseFloat(process.env.MAX_BOUNCE_RATE_PERCENT || '2');
  const maxUnsubRate = parseFloat(process.env.MAX_UNSUB_RATE_PERCENT || '0.5');
  const maxComplaintRate = parseFloat(process.env.MAX_COMPLAINT_RATE_PERCENT || '0.1');

  const metrics = { bounceRate, unsubRate, complaintRate };

  if (bounceRate >= maxBounceRate) {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'paused' },
    });
    return { shouldPause: true, reason: `Bounce rate ${bounceRate.toFixed(1)}% exceeds ${maxBounceRate}%`, metrics };
  }

  if (unsubRate >= maxUnsubRate) {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'paused' },
    });
    return { shouldPause: true, reason: `Unsubscribe rate ${unsubRate.toFixed(1)}% exceeds ${maxUnsubRate}%`, metrics };
  }

  if (complaintRate >= maxComplaintRate) {
    await prisma.emailCampaign.update({
      where: { id: campaignId },
      data: { status: 'paused' },
    });
    return { shouldPause: true, reason: `Complaint rate ${complaintRate.toFixed(1)}% exceeds ${maxComplaintRate}%`, metrics };
  }

  return { shouldPause: false, reason: '', metrics };
}

// ── Engagement Scoring ──

/**
 * Update a lead's engagement score based on recent activity.
 * Called when opens/clicks/replies are tracked.
 */
export async function updateEngagement(leadId: string, eventType: 'opened' | 'clicked' | 'replied'): Promise<void> {
  const weights = { opened: 10, clicked: 25, replied: 50 };
  const weight = weights[eventType] || 0;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { engagementScore: true },
    });

    if (!lead) return;

    // Score decays over time but bumps up on new activity, capped at 100
    const newScore = Math.min(100, Math.max(0, (lead.engagementScore || 0) + weight));

    await prisma.lead.update({
      where: { id: leadId },
      data: {
        engagementScore: newScore,
        lastEngagedAt: new Date(),
      },
    });
  } catch {
    // Silently fail — engagement tracking shouldn't break sends
  }
}

// ── Soft Bounce Retry Queue ──

/**
 * Queue a soft-bounced email for retry.
 */
export async function queueSoftBounceRetry(params: {
  leadId: string;
  campaignId?: string;
  email: string;
  subject: string;
  html: string;
  error: string;
}): Promise<void> {
  try {
    // Check existing retries for this lead+campaign
    const existing = await prisma.softBounceQueue.findFirst({
      where: {
        leadId: params.leadId,
        campaignId: params.campaignId || undefined,
      },
    });

    if (existing && existing.retries >= 3) {
      // Max retries reached — mark as hard bounce
      await prisma.lead.update({
        where: { id: params.leadId },
        data: { bounceType: 'hard', bounceCount: { increment: 1 }, lastBounceAt: new Date() },
      });
      await prisma.softBounceQueue.delete({ where: { id: existing.id } });
      return;
    }

    // Retry delays: 1h, 6h, 24h
    const retryDelays = [1 * 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];
    const retries = existing ? existing.retries + 1 : 0;
    const nextRetry = new Date(Date.now() + (retryDelays[retries] || retryDelays[2]));

    if (existing) {
      await prisma.softBounceQueue.update({
        where: { id: existing.id },
        data: { retries, nextRetry, error: params.error },
      });
    } else {
      await prisma.softBounceQueue.create({
        data: {
          leadId: params.leadId,
          campaignId: params.campaignId,
          email: params.email,
          subject: params.subject,
          html: params.html,
          retries: 0,
          nextRetry,
          error: params.error,
        },
      });
    }
  } catch {
    // Queue failure shouldn't block campaign
  }
}

// ── Domain Auth Enforcement ──

/**
 * Check if the sending domain has proper authentication (SPF, DKIM, DMARC).
 * Returns { verified, missing[] }
 */
export async function checkDomainAuth(fromEmail?: string): Promise<{
  verified: boolean;
  missing: string[];
  domainName: string | null;
}> {
  // Extract domain from from-email or use first configured domain
  let domainName: string | null = null;

  if (fromEmail) {
    const parts = fromEmail.split('@');
    if (parts.length === 2) domainName = parts[1];
  }

  const domain = domainName
    ? await prisma.domain.findFirst({ where: { name: domainName } })
    : await prisma.domain.findFirst({ where: { verified: true } });

  if (!domain) {
    // No domain configured — allow sending (Resend handles auth)
    return { verified: true, missing: [], domainName: null };
  }

  if (domain.verified) {
    return { verified: true, missing: [], domainName: domain.name };
  }

  // Parse last check result to find what's missing
  const missing: string[] = [];
  if (domain.lastCheckResult) {
    try {
      const result = JSON.parse(domain.lastCheckResult);
      if (result.spf?.status !== 'pass') missing.push('SPF');
      if (result.dkim?.status !== 'pass') missing.push('DKIM');
      if (result.dmarc?.status !== 'pass') missing.push('DMARC');
    } catch {
      missing.push('SPF', 'DKIM', 'DMARC');
    }
  } else {
    missing.push('Not checked');
  }

  return { verified: false, missing, domainName: domain.name };
}

// ── Deliverability Snapshot ──

/**
 * Record daily deliverability metrics snapshot.
 * Should be called by a daily cron job.
 */
export async function recordDailySnapshot(): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);
  const since = new Date(today + 'T00:00:00Z');
  const until = new Date(today + 'T23:59:59Z');

  try {
    const events = await prisma.emailEvent.findMany({
      where: {
        createdAt: { gte: since, lte: until },
      },
      select: { type: true },
    });

    const counts: Record<string, number> = {};
    for (const e of events) {
      counts[e.type] = (counts[e.type] || 0) + 1;
    }

    const totalSent = counts.sent || 0;
    const totalBounced = (counts.bounced || 0);
    const hardBounces = 0; // Would need more specific tracking
    const softBounces = 0;
    const complaints = counts.complained || 0;
    const unsubscribes = counts.unsubscribed || 0;
    const opens = counts.opened || 0;
    const clicks = counts.clicked || 0;
    const replies = counts.replied || 0;

    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const complaintRate = totalSent > 0 ? (complaints / totalSent) * 100 : 0;
    const unsubRate = totalSent > 0 ? (unsubscribes / totalSent) * 100 : 0;
    const openRate = totalSent > 0 ? (opens / totalSent) * 100 : 0;

    await prisma.deliverabilitySnapshot.upsert({
      where: { date: today },
      update: {
        totalSent, totalBounced, hardBounces, softBounces,
        complaints, unsubscribes, opens, clicks, replies,
        bounceRate, complaintRate, unsubRate, openRate,
      },
      create: {
        date: today,
        totalSent, totalBounced, hardBounces, softBounces,
        complaints, unsubscribes, opens, clicks, replies,
        bounceRate, complaintRate, unsubRate, openRate,
      },
    });
  } catch (err) {
    console.error('[Deliverability] Snapshot failed:', err);
  }
}

// ── Deliverability Score Calculator ──

/**
 * Calculate overall deliverability health score (0-100).
 * Based on recent bounce rate, complaint rate, engagement, and domain auth.
 */
export async function getDeliverabilityScore(): Promise<{
  score: number;
  rating: string;
  factors: { name: string; score: number; status: 'good' | 'warning' | 'danger'; detail: string }[];
}> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get 30-day events
  const events = await prisma.emailEvent.findMany({
    where: { createdAt: { gte: thirtyDaysAgo } },
    select: { type: true },
  });

  const counts: Record<string, number> = {};
  for (const e of events) counts[e.type] = (counts[e.type] || 0) + 1;

  const totalSent = counts.sent || 0;
  const bounced = counts.bounced || 0;
  const opened = counts.opened || 0;
  const complaints = counts.complained || 0;
  const unsubscribed = counts.unsubscribed || 0;

  // Get lead health stats
  const leadStats = await prisma.lead.aggregate({
    _count: true,
    _avg: { engagementScore: true, bounceCount: true },
  });

  const complainedLeads = await prisma.lead.count({
    where: { complainedAt: { not: null } },
  });

  const hardBounceLeads = await prisma.lead.count({
    where: { bounceType: 'hard' },
  });

  // Domain auth check
  const domainAuth = await checkDomainAuth();

  // Calculate factor scores
  const factors: { name: string; score: number; status: 'good' | 'warning' | 'danger'; detail: string }[] = [];

  // 1. Bounce rate (25 points)
  const bounceRate = totalSent > 0 ? (bounced / totalSent) * 100 : 0;
  const bounceScore = bounceRate <= 1 ? 25 : bounceRate <= 2 ? 20 : bounceRate <= 5 ? 10 : 0;
  factors.push({
    name: 'Bounce Rate',
    score: bounceScore,
    status: bounceRate <= 2 ? 'good' : bounceRate <= 5 ? 'warning' : 'danger',
    detail: totalSent > 0 ? `${bounceRate.toFixed(1)}% (${bounced}/${totalSent})` : 'No sends yet',
  });

  // 2. Complaint rate (25 points)
  const complaintRate = totalSent > 0 ? (complaints / totalSent) * 100 : 0;
  const complaintScore = complaintRate <= 0.05 ? 25 : complaintRate <= 0.1 ? 20 : complaintRate <= 0.3 ? 10 : 0;
  factors.push({
    name: 'Complaint Rate',
    score: complaintScore,
    status: complaintRate <= 0.1 ? 'good' : complaintRate <= 0.3 ? 'warning' : 'danger',
    detail: totalSent > 0 ? `${complaintRate.toFixed(2)}% (${complaints}/${totalSent})` : 'No complaints',
  });

  // 3. Engagement (open rate) (25 points)
  const openRate = totalSent > 0 ? (opened / totalSent) * 100 : 0;
  const engageScore = openRate >= 20 ? 25 : openRate >= 10 ? 20 : openRate >= 5 ? 10 : totalSent === 0 ? 15 : 0;
  factors.push({
    name: 'Engagement',
    score: engageScore,
    status: openRate >= 15 ? 'good' : openRate >= 5 ? 'warning' : totalSent === 0 ? 'warning' : 'danger',
    detail: totalSent > 0 ? `${openRate.toFixed(1)}% open rate` : 'No data yet',
  });

  // 4. List hygiene (25 points)
  const totalLeads = leadStats._count || 1;
  const invalidRate = ((hardBounceLeads + complainedLeads) / totalLeads) * 100;
  const hygieneScore = invalidRate <= 1 ? 25 : invalidRate <= 3 ? 20 : invalidRate <= 5 ? 10 : 0;
  factors.push({
    name: 'List Hygiene',
    score: hygieneScore,
    status: invalidRate <= 2 ? 'good' : invalidRate <= 5 ? 'warning' : 'danger',
    detail: `${hardBounceLeads} hard bounces, ${complainedLeads} complaints out of ${totalLeads} leads`,
  });

  // 5. Domain Auth (bonus — affects rating)
  factors.push({
    name: 'Domain Auth',
    score: domainAuth.verified ? 0 : 0, // Bonus context, not scored numerically
    status: domainAuth.verified ? 'good' : domainAuth.domainName ? 'danger' : 'warning',
    detail: domainAuth.verified
      ? `${domainAuth.domainName || 'Resend'} — SPF/DKIM/DMARC verified`
      : domainAuth.domainName
        ? `Missing: ${domainAuth.missing.join(', ')}`
        : 'No custom domain configured',
  });

  const totalScore = Math.min(100, bounceScore + complaintScore + engageScore + hygieneScore);
  const rating = totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Fair' : 'Poor';

  return { score: totalScore, rating, factors };
}

// ── Utility: Get suppressed lead count ──

export async function getSuppressionStats(): Promise<{
  hardBounces: number;
  complaints: number;
  unsubscribed: number;
  invalid: number;
  disposable: number;
  disengaged: number;
  total: number;
}> {
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const [hardBounces, complaints, unsubscribed, invalid, disposable, disengaged] = await Promise.all([
    prisma.lead.count({ where: { bounceType: 'hard' } }),
    prisma.lead.count({ where: { complainedAt: { not: null } } }),
    prisma.lead.count({ where: { unsubscribed: true } }),
    prisma.lead.count({ where: { verifyResult: 'invalid' } }),
    prisma.lead.count({ where: { verifyResult: 'disposable' } }),
    prisma.lead.count({
      where: {
        emailsSent: { gte: 5 },
        lastEngagedAt: { lt: sixtyDaysAgo },
      },
    }),
  ]);

  return {
    hardBounces,
    complaints,
    unsubscribed,
    invalid,
    disposable,
    disengaged,
    total: hardBounces + complaints + unsubscribed + invalid + disposable + disengaged,
  };
}

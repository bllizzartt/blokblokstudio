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

// ── Global Rate Limiter (in-memory, resets on deploy) ──
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

// ── Per-ISP Rate Limiting ──
// Gmail, Outlook, and Yahoo have different tolerance levels.
// Exceeding these causes deferrals/blocks that tank sender reputation.

interface IspRateLimit {
  maxPerHour: number;
  windowStart: number;
  count: number;
}

const ISP_LIMITS: Record<string, number> = {
  'gmail.com': 100,        // Google is strictest
  'googlemail.com': 100,
  'outlook.com': 300,
  'hotmail.com': 300,
  'live.com': 300,
  'msn.com': 300,
  'yahoo.com': 50,         // Yahoo is very aggressive with blocking
  'yahoo.co.uk': 50,
  'ymail.com': 50,
  'aol.com': 100,
  'icloud.com': 200,
  'me.com': 200,
  'mac.com': 200,
  'protonmail.com': 200,
  'zoho.com': 200,
};

// In-memory per-ISP counters (reset on deploy or hourly)
const ispCounters: Map<string, IspRateLimit> = new Map();

/**
 * Extract the ISP group from an email address.
 * Groups related domains (e.g., gmail.com + googlemail.com → "gmail.com")
 */
function getIspGroup(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  // Group related domains
  if (['googlemail.com'].includes(domain)) return 'gmail.com';
  if (['hotmail.com', 'live.com', 'msn.com'].includes(domain)) return 'outlook.com';
  if (['yahoo.co.uk', 'ymail.com'].includes(domain)) return 'yahoo.com';
  if (['me.com', 'mac.com'].includes(domain)) return 'icloud.com';
  return domain;
}

/**
 * Check per-ISP rate limit for a recipient email.
 * Returns { allowed, waitMs, isp } — if not allowed, waitMs is suggested delay.
 */
export function checkIspRateLimit(recipientEmail: string): { allowed: boolean; waitMs: number; isp: string } {
  const isp = getIspGroup(recipientEmail);
  const limit = ISP_LIMITS[isp];

  // No specific limit for this ISP — allow (global limit still applies)
  if (!limit) return { allowed: true, waitMs: 0, isp };

  const now = Date.now();
  let counter = ispCounters.get(isp);

  // Reset hourly window
  if (!counter || (now - counter.windowStart >= 3600_000)) {
    counter = { maxPerHour: limit, windowStart: now, count: 0 };
    ispCounters.set(isp, counter);
  }

  if (counter.count >= limit) {
    const waitMs = 3600_000 - (now - counter.windowStart);
    console.warn(`[ISP-Limit] ${isp} limit reached (${counter.count}/${limit}/hr) — wait ${Math.round(waitMs / 1000)}s`);
    return { allowed: false, waitMs: Math.max(waitMs, 1000), isp };
  }

  counter.count++;
  return { allowed: true, waitMs: 0, isp };
}

/**
 * Get current ISP rate limit status for monitoring.
 */
export function getIspRateLimitStatus(): Record<string, { count: number; limit: number; remaining: number }> {
  const status: Record<string, { count: number; limit: number; remaining: number }> = {};
  for (const [isp, counter] of ispCounters.entries()) {
    const limit = ISP_LIMITS[isp] || 999;
    status[isp] = {
      count: counter.count,
      limit,
      remaining: Math.max(0, limit - counter.count),
    };
  }
  return status;
}

// ── Engagement-Based Send Speed Throttling ──
// Send faster to engaged leads, slower to cold leads.
// This mimics natural human sending patterns and reduces ISP suspicion.

export type EngagementTier = 'hot' | 'warm' | 'cold' | 'ice';

/**
 * Get the engagement tier for a lead based on their score and activity.
 */
export function getEngagementTier(engagementScore: number, lastEngagedAt: Date | null, emailsSent: number): EngagementTier {
  // New leads (0 emails sent) are "warm" — we don't know yet
  if (emailsSent === 0) return 'warm';

  // Recent engagement + high score = hot
  if (engagementScore >= 50 && lastEngagedAt) {
    const daysSinceEngagement = Math.floor((Date.now() - new Date(lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceEngagement <= 7) return 'hot';
    if (daysSinceEngagement <= 30) return 'warm';
  }

  // Moderate engagement
  if (engagementScore >= 20) return 'warm';

  // Low engagement + many emails = ice cold
  if (engagementScore < 10 && emailsSent >= 3) return 'ice';

  return 'cold';
}

/**
 * Get the recommended delay (in ms) between sends based on engagement tier.
 * Hot leads: minimal delay (they want our emails)
 * Cold leads: longer delays (reduces ISP suspicion + gives them breathing room)
 */
export function getEngagementDelay(tier: EngagementTier): number {
  const delays: Record<EngagementTier, { min: number; max: number }> = {
    hot:  { min: 200, max: 500 },      // 200-500ms — fast, natural pace
    warm: { min: 500, max: 1500 },     // 0.5-1.5s — moderate pace
    cold: { min: 1500, max: 4000 },    // 1.5-4s — slow and careful
    ice:  { min: 4000, max: 8000 },    // 4-8s — very cautious
  };

  const { min, max } = delays[tier];
  return min + Math.random() * (max - min);
}

// ── Bounce Trend Detection with Predictive Alerts ──

export interface BounceTrend {
  trending: 'rising' | 'falling' | 'stable';
  severity: 'critical' | 'warning' | 'info' | 'ok';
  message: string;
  dailyRates: { date: string; rate: number; sent: number; bounced: number }[];
  prediction: string;
  shouldAlert: boolean;
  shouldPause: boolean;
}

/**
 * Analyze bounce rate trends over the last 7 days.
 * Detects rising trends early before they trigger ISP blocks.
 *
 * Uses linear regression on daily bounce rates to predict if we're heading
 * toward dangerous territory (>2% bounce rate = Spamhaus threshold).
 */
export async function detectBounceTrend(): Promise<BounceTrend> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const snapshots = await prisma.deliverabilitySnapshot.findMany({
    where: { date: { gte: sevenDaysAgo } },
    orderBy: { date: 'asc' },
    select: { date: true, totalSent: true, totalBounced: true, bounceRate: true },
  });

  // Need at least 3 days of data for trend detection
  if (snapshots.length < 3) {
    return {
      trending: 'stable',
      severity: 'info',
      message: 'Insufficient data for trend detection (need 3+ days)',
      dailyRates: snapshots.map(s => ({
        date: s.date,
        rate: s.bounceRate,
        sent: s.totalSent,
        bounced: s.totalBounced,
      })),
      prediction: 'Need more data',
      shouldAlert: false,
      shouldPause: false,
    };
  }

  const dailyRates = snapshots.map(s => ({
    date: s.date,
    rate: s.bounceRate,
    sent: s.totalSent,
    bounced: s.totalBounced,
  }));

  // Calculate linear regression (simple least squares)
  const n = dailyRates.length;
  const xValues = dailyRates.map((_, i) => i);
  const yValues = dailyRates.map(d => d.rate);

  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  const currentRate = yValues[yValues.length - 1];
  const avgRate = sumY / n;

  // Predict rate in 3 days
  const predictedRate = intercept + slope * (n + 2);

  // Determine trend direction
  let trending: 'rising' | 'falling' | 'stable';
  if (slope > 0.1) trending = 'rising';
  else if (slope < -0.1) trending = 'falling';
  else trending = 'stable';

  // Determine severity
  let severity: 'critical' | 'warning' | 'info' | 'ok';
  let shouldAlert = false;
  let shouldPause = false;
  let message: string;
  let prediction: string;

  if (currentRate >= 5) {
    severity = 'critical';
    shouldAlert = true;
    shouldPause = true;
    message = `Bounce rate at ${currentRate.toFixed(1)}% — CRITICAL. Auto-pause recommended.`;
    prediction = `Current rate exceeds safe threshold. Immediate action required.`;
  } else if (trending === 'rising' && predictedRate >= 3) {
    severity = 'critical';
    shouldAlert = true;
    shouldPause = currentRate >= 3;
    message = `Bounce rate rising — predicted to reach ${predictedRate.toFixed(1)}% in 3 days`;
    prediction = `At current trend (+${slope.toFixed(2)}%/day), will exceed 3% threshold in ~${Math.max(1, Math.ceil((3 - currentRate) / Math.max(slope, 0.01)))} days`;
  } else if (trending === 'rising' && currentRate >= 2) {
    severity = 'warning';
    shouldAlert = true;
    message = `Bounce rate trending up at ${currentRate.toFixed(1)}% (slope: +${slope.toFixed(2)}%/day)`;
    prediction = `May reach ${predictedRate.toFixed(1)}% in 3 days if trend continues`;
  } else if (trending === 'rising') {
    severity = 'info';
    message = `Slight upward trend in bounce rate (${currentRate.toFixed(1)}%, slope: +${slope.toFixed(2)}%/day)`;
    prediction = `Projected ${predictedRate.toFixed(1)}% in 3 days — monitor closely`;
  } else if (trending === 'falling') {
    severity = 'ok';
    message = `Bounce rate improving — down to ${currentRate.toFixed(1)}% (avg: ${avgRate.toFixed(1)}%)`;
    prediction = `Projected ${Math.max(0, predictedRate).toFixed(1)}% in 3 days — great trajectory`;
  } else {
    severity = currentRate <= 1 ? 'ok' : currentRate <= 2 ? 'info' : 'warning';
    message = `Bounce rate stable at ${currentRate.toFixed(1)}%`;
    prediction = `Expected to remain around ${avgRate.toFixed(1)}%`;
    shouldAlert = currentRate >= 2;
  }

  return {
    trending,
    severity,
    message,
    dailyRates,
    prediction,
    shouldAlert,
    shouldPause,
  };
}

// ── Content Fingerprinting (Anti-Template-Spam) ──
// ISPs like Gmail detect when the same body is sent to many recipients.
// They call this "template spam" and it tanks deliverability.
// This system tracks content hashes and enforces variation.

const contentFingerprints: Map<string, { count: number; firstSeen: number }> = new Map();
const FINGERPRINT_WINDOW_MS = 60 * 60 * 1000; // 1-hour window
const MAX_IDENTICAL_PER_WINDOW = 5; // Max sends with same content hash in 1 hour

/**
 * Generate a content fingerprint from email HTML.
 * Strips variable parts (names, dates) to detect structurally identical emails.
 */
function generateContentFingerprint(html: string): string {
  // Normalize: strip whitespace, lowercase, remove tracking pixels, strip personalization
  const normalized = html
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/<img[^>]*tracking[^>]*>/gi, '') // Remove tracking pixels
    .replace(/<img[^>]*width="1"[^>]*>/gi, '')
    .replace(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/g, '[EMAIL]') // Normalize emails
    .replace(/\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b/g, '[DATE]') // Normalize dates
    .replace(/https?:\/\/[^\s"<]+/g, '[URL]') // Normalize URLs
    .trim();

  // Simple hash using FNV-1a algorithm (fast, good distribution)
  let hash = 0x811c9dc5;
  for (let i = 0; i < normalized.length; i++) {
    hash ^= normalized.charCodeAt(i);
    hash = (hash * 0x01000193) >>> 0;
  }
  return hash.toString(16);
}

/**
 * Check if this email content has been sent too many times recently.
 * Returns { allowed, similarSent, suggestion }
 *
 * If not allowed, the caller should add variation (spintax, personalization)
 * or delay the send to spread it over time.
 */
export function checkContentFingerprint(html: string): {
  allowed: boolean;
  similarSent: number;
  suggestion: string;
  fingerprint: string;
} {
  const now = Date.now();
  const fingerprint = generateContentFingerprint(html);

  // Clean up old fingerprints
  for (const [key, data] of contentFingerprints.entries()) {
    if (now - data.firstSeen > FINGERPRINT_WINDOW_MS) {
      contentFingerprints.delete(key);
    }
  }

  const existing = contentFingerprints.get(fingerprint);

  if (!existing) {
    contentFingerprints.set(fingerprint, { count: 1, firstSeen: now });
    return { allowed: true, similarSent: 0, suggestion: '', fingerprint };
  }

  existing.count++;

  if (existing.count > MAX_IDENTICAL_PER_WINDOW) {
    return {
      allowed: false,
      similarSent: existing.count,
      suggestion: 'Too many identical emails — add spintax variations, personalize content, or spread sends over longer period',
      fingerprint,
    };
  }

  // Warn when approaching limit
  if (existing.count >= MAX_IDENTICAL_PER_WINDOW - 1) {
    return {
      allowed: true,
      similarSent: existing.count,
      suggestion: `Approaching template limit (${existing.count}/${MAX_IDENTICAL_PER_WINDOW}) — consider adding more content variation`,
      fingerprint,
    };
  }

  return { allowed: true, similarSent: existing.count, suggestion: '', fingerprint };
}

/**
 * Get content fingerprint stats for monitoring.
 */
export function getContentFingerprintStats(): { uniqueTemplates: number; totalSent: number; highestCount: number } {
  let totalSent = 0;
  let highestCount = 0;
  for (const data of contentFingerprints.values()) {
    totalSent += data.count;
    if (data.count > highestCount) highestCount = data.count;
  }
  return {
    uniqueTemplates: contentFingerprints.size,
    totalSent,
    highestCount,
  };
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

  // Email verification results — block invalid, disposable, and catch-all
  const blockedResults = ['invalid', 'disposable', 'catch_all'];
  if (lead.verifyResult && blockedResults.includes(lead.verifyResult)) {
    return { eligible: false, reason: `Email ${lead.verifyResult}` };
  }

  // Block role-based emails (info@, admin@, noreply@, abuse@, etc.)
  const rolePatterns = /^(info|admin|abuse|noreply|no-reply|postmaster|webmaster|hostmaster|support|security|sales|contact|help|billing)@/i;
  if (rolePatterns.test(lead.email)) {
    return { eligible: false, reason: 'Role-based email address' };
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

  const eligible: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  const blockedResults = ['invalid', 'disposable', 'catch_all'];
  const rolePatterns = /^(info|admin|abuse|noreply|no-reply|postmaster|webmaster|hostmaster|support|security|sales|contact|help|billing)@/i;

  for (const lead of leads) {
    if (lead.unsubscribed) {
      skipped.push({ id: lead.id, reason: 'Unsubscribed' });
    } else if (lead.complainedAt) {
      skipped.push({ id: lead.id, reason: 'Complaint suppressed' });
    } else if (lead.bounceType === 'hard' || lead.bounceCount >= 3) {
      skipped.push({ id: lead.id, reason: 'Hard bounce' });
    } else if (lead.verifyResult && blockedResults.includes(lead.verifyResult)) {
      skipped.push({ id: lead.id, reason: `Email ${lead.verifyResult}` });
    } else if (rolePatterns.test(lead.email)) {
      skipped.push({ id: lead.id, reason: 'Role-based email' });
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

// ── Engagement Scoring with Time Decay ──

/**
 * Update a lead's engagement score based on recent activity.
 * Called when opens/clicks/replies are tracked.
 *
 * Implements time-decay: scores naturally decline over time.
 * A lead who opened 6 months ago shouldn't still be "hot."
 *
 * Also implements negative scoring: consecutive unopened emails
 * actively reduce the score (ISPs care about this pattern).
 */
export async function updateEngagement(leadId: string, eventType: 'opened' | 'clicked' | 'replied'): Promise<void> {
  const weights = { opened: 10, clicked: 25, replied: 50 };
  const weight = weights[eventType] || 0;

  try {
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      select: { engagementScore: true, lastEngagedAt: true },
    });

    if (!lead) return;

    // Apply time-decay before adding new engagement
    // Score loses 5% per week since last engagement (natural decay)
    let currentScore = lead.engagementScore || 0;
    if (lead.lastEngagedAt) {
      const daysSinceEngagement = (Date.now() - new Date(lead.lastEngagedAt).getTime()) / (1000 * 60 * 60 * 24);
      const weeksSinceEngagement = daysSinceEngagement / 7;
      const decayFactor = Math.pow(0.95, weeksSinceEngagement); // 5% decay per week
      currentScore = Math.round(currentScore * decayFactor);
    }

    // Add new engagement weight
    const newScore = Math.min(100, Math.max(0, currentScore + weight));

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

/**
 * Apply negative engagement scoring when an email is sent but not engaged with.
 * Called by the daily monitor cron to penalize leads who aren't engaging.
 *
 * This is critical because ISPs track "send-to-engagement ratio" —
 * if you keep sending to leads who never open, your IP reputation tanks.
 */
export async function applyEngagementDecay(): Promise<{ decayed: number; suppressed: number }> {
  let decayed = 0;
  let suppressed = 0;

  try {
    // Find leads who received emails in the last 7 days but didn't engage
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const disengagedLeads = await prisma.lead.findMany({
      where: {
        lastEmailAt: { gte: sevenDaysAgo },
        emailsSent: { gte: 2 },
        OR: [
          { lastEngagedAt: null },
          { lastEngagedAt: { lt: sevenDaysAgo } },
        ],
        unsubscribed: false,
        complainedAt: null,
        bounceType: { not: 'hard' },
      },
      select: { id: true, engagementScore: true, emailsSent: true, lastEngagedAt: true },
      take: 500, // Process in batches
    });

    for (const lead of disengagedLeads) {
      // Apply -3 per unopened email cycle (capped at 0)
      const newScore = Math.max(0, (lead.engagementScore || 0) - 3);

      if (newScore !== lead.engagementScore) {
        await prisma.lead.update({
          where: { id: lead.id },
          data: { engagementScore: newScore },
        });
        decayed++;
      }

      // Auto-suppress if score hits 0 and they've received 5+ emails
      if (newScore === 0 && lead.emailsSent >= 5) {
        suppressed++;
      }
    }
  } catch (err) {
    console.error('[EngagementDecay] Error:', err);
  }

  return { decayed, suppressed };
}

// ── Human Send Pattern Simulation ──
// ISPs detect mechanical sending by analyzing inter-arrival times.
// Real humans have burst/pause patterns, not uniform spacing.

/**
 * Generate a human-like delay between sends.
 * Combines engagement-based delays with natural behavioral patterns:
 *
 * 1. Burst mode: Occasional fast batches (like a human clearing their inbox)
 * 2. Pause mode: Random longer pauses (like reading a response or switching tasks)
 * 3. Micro-jitter: ±20% randomness on every delay (eliminates mechanical patterns)
 * 4. Time-of-day awareness: Slightly slower during off-hours
 */
export function getHumanizedDelay(engagementTier: EngagementTier, sendIndex: number): number {
  // Base delay from engagement tier
  const baseDelay = getEngagementDelay(engagementTier);

  // Every 3-7 sends, simulate a "pause" (human checking something)
  const burstSize = 3 + Math.floor(Math.random() * 5);
  const isPause = sendIndex > 0 && sendIndex % burstSize === 0;
  const pauseMultiplier = isPause ? (2 + Math.random() * 4) : 1; // 2-6x pause

  // Every 15-25 sends, simulate a longer break (human getting coffee, etc.)
  const breakInterval = 15 + Math.floor(Math.random() * 11);
  const isBreak = sendIndex > 0 && sendIndex % breakInterval === 0;
  const breakMs = isBreak ? (10000 + Math.random() * 20000) : 0; // 10-30s break

  // Micro-jitter: ±20% on every delay
  const jitter = 0.8 + Math.random() * 0.4; // 0.8 to 1.2

  // Time-of-day factor: slightly slower during typical non-business hours UTC
  const hourUTC = new Date().getUTCHours();
  const offHoursFactor = (hourUTC < 8 || hourUTC > 20) ? 1.3 : 1.0;

  return Math.round((baseDelay * pauseMultiplier * jitter * offHoursFactor) + breakMs);
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

// ── Link Validation (Pre-Send) ──

/**
 * Validate all URLs in email HTML before sending.
 * Broken links in emails are a spam signal — ISPs check this.
 * Returns list of invalid/broken links found.
 */
export function validateEmailLinks(html: string): {
  valid: boolean;
  brokenLinks: { url: string; reason: string }[];
  totalLinks: number;
} {
  const urlRegex = /href=["'](https?:\/\/[^"'\s>]+)["']/gi;
  const links: string[] = [];
  let match;

  while ((match = urlRegex.exec(html)) !== null) {
    links.push(match[1]);
  }

  const brokenLinks: { url: string; reason: string }[] = [];

  for (const url of links) {
    try {
      const parsed = new URL(url);

      // Check for common broken URL patterns
      if (!parsed.hostname || parsed.hostname === 'localhost') {
        brokenLinks.push({ url, reason: 'localhost or empty hostname' });
        continue;
      }

      // Check for placeholder URLs that weren't replaced
      if (url.includes('{{') || url.includes('}}') || url.includes('example.com')) {
        brokenLinks.push({ url, reason: 'Placeholder URL not replaced' });
        continue;
      }

      // Check for common typos in popular domains
      const suspiciousDomains = ['gogle.com', 'gooogle.com', 'lnkedin.com', 'facebok.com'];
      if (suspiciousDomains.includes(parsed.hostname)) {
        brokenLinks.push({ url, reason: 'Likely typo in domain' });
        continue;
      }

      // Check for URLs that will trigger ISP spam filters
      const flaggedTlds = ['.xyz', '.top', '.click', '.link', '.info'];
      const tld = '.' + parsed.hostname.split('.').pop();
      if (flaggedTlds.includes(tld)) {
        brokenLinks.push({ url, reason: `TLD "${tld}" frequently flagged as spam` });
        continue;
      }

      // Check for URL shorteners (ISPs flag these in cold email)
      const shorteners = ['bit.ly', 'tinyurl.com', 'goo.gl', 't.co', 'ow.ly', 'is.gd', 'buff.ly'];
      if (shorteners.includes(parsed.hostname)) {
        brokenLinks.push({ url, reason: 'URL shortener — ISPs flag these in cold email' });
        continue;
      }
    } catch {
      brokenLinks.push({ url, reason: 'Invalid URL format' });
    }
  }

  return {
    valid: brokenLinks.length === 0,
    brokenLinks,
    totalLinks: links.length,
  };
}

// ── DMARC Enforcement Gate ──

/**
 * Check if the sending domain has DMARC at enforcement level.
 * Gmail permanently rejects non-compliant mail since Nov 2025.
 * Microsoft started rejecting May 2025 for outlook.com/hotmail.com.
 *
 * This gate blocks sending to major ISPs if DMARC is p=none.
 */
export async function checkDmarcEnforcement(recipientEmail: string): Promise<{
  allowed: boolean;
  reason: string;
}> {
  const recipientDomain = recipientEmail.split('@')[1]?.toLowerCase() || '';

  // Only enforce for ISPs that reject on DMARC failure
  const strictIsps = [
    'gmail.com', 'googlemail.com',
    'outlook.com', 'hotmail.com', 'live.com', 'msn.com',
    'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'aol.com',
  ];

  if (!strictIsps.includes(recipientDomain)) {
    return { allowed: true, reason: 'ISP does not require DMARC enforcement' };
  }

  // Check our sending domain's DMARC policy
  try {
    const latestCheck = await prisma.dnsHealthCheck.findFirst({
      where: { dmarcStatus: { not: 'unknown' } },
      orderBy: { checkedAt: 'desc' },
    });

    if (!latestCheck) {
      // No DNS check yet — allow but warn
      return { allowed: true, reason: 'No DNS health check found — run monitor first' };
    }

    // Parse stored details to check DMARC policy
    if (latestCheck.details) {
      try {
        const details = JSON.parse(latestCheck.details);
        const dmarcPolicy = details?.dmarc?.policy;

        if (dmarcPolicy === 'none') {
          console.warn(`[DMARC] Sending to ${recipientDomain} with p=none — recipient ISP may reject`);
          // Don't block (yet) but log aggressively — user should upgrade DMARC
          return {
            allowed: true,
            reason: `WARNING: DMARC policy is p=none. ${recipientDomain} may reject your emails. Upgrade to p=quarantine or p=reject.`,
          };
        }

        if (dmarcPolicy === 'quarantine' || dmarcPolicy === 'reject') {
          return { allowed: true, reason: `DMARC ${dmarcPolicy} — fully compliant` };
        }
      } catch { /* parse error — allow */ }
    }

    if (latestCheck.dmarcStatus === 'fail' || latestCheck.dmarcStatus === 'missing') {
      return {
        allowed: false,
        reason: `DMARC is ${latestCheck.dmarcStatus} — ${recipientDomain} will reject your emails. Set up DMARC first.`,
      };
    }
  } catch {
    // DNS check failed — don't block sends
  }

  return { allowed: true, reason: 'OK' };
}

// ── Recipient Timezone-Aware Sending ──

/**
 * Estimate the recipient's timezone from their email domain.
 * Uses TLD-based heuristics (not perfect, but much better than UTC-only).
 *
 * Returns recommended send hour offset from UTC.
 * This ensures emails arrive during business hours in the recipient's timezone.
 */
export function estimateRecipientTimezone(email: string): {
  estimatedOffset: number; // Hours from UTC
  confidence: 'high' | 'medium' | 'low';
  region: string;
} {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  const tld = domain.split('.').pop() || '';

  // Country TLD → timezone offset mapping (business hours midpoint)
  const tldTimezones: Record<string, { offset: number; region: string }> = {
    'uk': { offset: 0, region: 'UK' },
    'de': { offset: 1, region: 'Germany' },
    'fr': { offset: 1, region: 'France' },
    'it': { offset: 1, region: 'Italy' },
    'es': { offset: 1, region: 'Spain' },
    'nl': { offset: 1, region: 'Netherlands' },
    'be': { offset: 1, region: 'Belgium' },
    'at': { offset: 1, region: 'Austria' },
    'ch': { offset: 1, region: 'Switzerland' },
    'pl': { offset: 1, region: 'Poland' },
    'se': { offset: 1, region: 'Sweden' },
    'no': { offset: 1, region: 'Norway' },
    'dk': { offset: 1, region: 'Denmark' },
    'fi': { offset: 2, region: 'Finland' },
    'gr': { offset: 2, region: 'Greece' },
    'ro': { offset: 2, region: 'Romania' },
    'il': { offset: 2, region: 'Israel' },
    'za': { offset: 2, region: 'South Africa' },
    'ae': { offset: 4, region: 'UAE' },
    'in': { offset: 5.5, region: 'India' },
    'sg': { offset: 8, region: 'Singapore' },
    'hk': { offset: 8, region: 'Hong Kong' },
    'cn': { offset: 8, region: 'China' },
    'kr': { offset: 9, region: 'South Korea' },
    'jp': { offset: 9, region: 'Japan' },
    'au': { offset: 10, region: 'Australia' },
    'nz': { offset: 12, region: 'New Zealand' },
    'ca': { offset: -5, region: 'Canada (Eastern)' },
    'br': { offset: -3, region: 'Brazil' },
    'mx': { offset: -6, region: 'Mexico' },
    'ar': { offset: -3, region: 'Argentina' },
  };

  // Check country TLD first
  const tldMatch = tldTimezones[tld];
  if (tldMatch) {
    return { estimatedOffset: tldMatch.offset, confidence: 'high', region: tldMatch.region };
  }

  // For .com/.org/.net, check the ISP for US/global defaults
  if (['com', 'org', 'net', 'io', 'co'].includes(tld)) {
    // US-centric domains default to Eastern time
    return { estimatedOffset: -5, confidence: 'low', region: 'US (assumed Eastern)' };
  }

  // Unknown TLD — assume UTC
  return { estimatedOffset: 0, confidence: 'low', region: 'Unknown' };
}

/**
 * Check if it's a good time to send to this recipient based on their estimated timezone.
 * Returns { shouldSend, reason, optimalHourUtc }
 * Business hours: 9am-6pm in recipient's local time.
 */
export function isGoodSendTime(email: string): {
  shouldSend: boolean;
  reason: string;
  recipientLocalHour: number;
  optimalSendHourUtc: number;
} {
  const tz = estimateRecipientTimezone(email);
  const nowUtc = new Date().getUTCHours();
  const recipientLocalHour = (nowUtc + tz.estimatedOffset + 24) % 24;

  // Business hours: 9am - 6pm in recipient's local time
  const isBusinessHours = recipientLocalHour >= 9 && recipientLocalHour < 18;

  // Optimal send time: 10am in recipient's local time
  const optimalSendHourUtc = (10 - tz.estimatedOffset + 24) % 24;

  if (isBusinessHours) {
    return {
      shouldSend: true,
      reason: `${recipientLocalHour}:00 local time (${tz.region}) — business hours`,
      recipientLocalHour,
      optimalSendHourUtc,
    };
  }

  // Allow sending if within extended hours (7am-9pm) but note it's not optimal
  if (recipientLocalHour >= 7 && recipientLocalHour < 21) {
    return {
      shouldSend: true,
      reason: `${recipientLocalHour}:00 local time (${tz.region}) — extended hours, not optimal`,
      recipientLocalHour,
      optimalSendHourUtc,
    };
  }

  return {
    shouldSend: false,
    reason: `${recipientLocalHour}:00 local time (${tz.region}) — outside business hours, defer to ${optimalSendHourUtc}:00 UTC`,
    recipientLocalHour,
    optimalSendHourUtc,
  };
}

// ── Seed Inbox Placement Testing ──

/**
 * Seed test configuration for inbox placement testing.
 * Run before campaigns to verify inbox vs spam placement.
 *
 * To use: Create seed accounts at Gmail, Outlook, Yahoo, iCloud
 * and add them to the SEED_ACCOUNTS env var as JSON array.
 */
export interface SeedTestResult {
  seedEmail: string;
  isp: string;
  placement: 'inbox' | 'spam' | 'promotions' | 'not_received' | 'pending';
  checkedAt: Date;
}

export function getSeedAccounts(): string[] {
  const seedJson = process.env.SEED_ACCOUNTS;
  if (!seedJson) return [];
  try {
    const seeds = JSON.parse(seedJson);
    return Array.isArray(seeds) ? seeds : [];
  } catch {
    return [];
  }
}

/**
 * Run a seed test by sending a test email to all seed accounts.
 * Returns the test ID for checking results later (via IMAP).
 *
 * Flow:
 * 1. Send identical email to all seed accounts
 * 2. Wait 5-10 minutes for delivery
 * 3. Check each seed account via IMAP for inbox/spam/promotions placement
 * 4. Return aggregated results
 */
export async function initiateSeedTest(
  subject: string,
  html: string,
): Promise<{
  testId: string;
  seedCount: number;
  seeds: string[];
}> {
  const seeds = getSeedAccounts();
  if (seeds.length === 0) {
    return { testId: '', seedCount: 0, seeds: [] };
  }

  // Generate unique test ID to identify this batch
  const testId = `seed_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

  // Tag the subject with a hidden test ID for identification
  const taggedSubject = `${subject} [${testId}]`;

  // Log the seed test initiation
  try {
    await prisma.emailEvent.create({
      data: {
        leadId: 'system',
        type: 'seed_test',
        details: JSON.stringify({ testId, seeds, initiatedAt: new Date().toISOString() }),
      },
    });
  } catch { /* best effort */ }

  return { testId, seedCount: seeds.length, seeds };
}

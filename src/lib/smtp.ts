import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { decrypt } from './crypto';
import { htmlToText } from './email';

interface SendingAccountData {
  id: string;
  email: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  dailyLimit: number;
  sentToday: number;
}

// Warmup phase limits — advancement requires BOTH calendar time AND engagement metrics
// This prevents scaling volume when reputation isn't ready (calendar-only warmup is dangerous)
export const WARMUP_PHASES: Record<number, {
  dailyLimit: number;
  label: string;
  daysRequired: number;
  minOpenRate: number;     // Minimum open rate % to advance (0 = no requirement)
  minHealthScore: number;  // Minimum health score to advance (0-100)
  maxBounceRate: number;   // Maximum bounce rate % allowed to advance
}> = {
  1: { dailyLimit: 5,   label: 'Phase 1 — Getting Started', daysRequired: 0,  minOpenRate: 0,  minHealthScore: 0,  maxBounceRate: 100 },
  2: { dailyLimit: 15,  label: 'Phase 2 — Building Trust',  daysRequired: 7,  minOpenRate: 15, minHealthScore: 30, maxBounceRate: 5 },
  3: { dailyLimit: 30,  label: 'Phase 3 — Growing Volume',  daysRequired: 14, minOpenRate: 20, minHealthScore: 50, maxBounceRate: 3 },
  4: { dailyLimit: 50,  label: 'Phase 4 — Scaling Up',      daysRequired: 28, minOpenRate: 20, minHealthScore: 60, maxBounceRate: 2 },
  5: { dailyLimit: 100, label: 'Phase 5 — Full Speed',      daysRequired: 42, minOpenRate: 15, minHealthScore: 70, maxBounceRate: 2 },
};

/**
 * Send an email via SMTP through a specific sending account.
 * Returns { success, bounced, bounceType } for tracking.
 */
export async function sendViaSMTP(
  account: SendingAccountData,
  {
    to,
    subject,
    html,
    text,
    replyTo,
    unsubscribeUrl,
    leadId,
    campaignId,
    inReplyTo,
    references,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    unsubscribeUrl?: string;
    leadId?: string;
    campaignId?: string;
    inReplyTo?: string;    // Message-ID of previous email in thread
    references?: string;   // Space-separated Message-IDs for full thread
  }
): Promise<{ success: boolean; bounced: boolean; bounceType?: string; messageId?: string }> {
  const sendingDomain = account.email.split('@')[1] || 'localhost';

  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: {
      user: account.smtpUser,
      pass: decrypt(account.smtpPass), // Decrypt from AES-256-GCM
    },
    name: sendingDomain,           // HELO/EHLO domain — must match PTR/rDNS
    connectionTimeout: 10_000,     // 10s connection timeout
    greetingTimeout: 10_000,       // 10s greeting timeout
    socketTimeout: 30_000,         // 30s socket timeout
    tls: {
      minVersion: 'TLSv1.2',      // Require TLS 1.2+ (ISP deliverability signal)
      rejectUnauthorized: false,   // Accept self-signed certs from MTAs
    },
    pool: true,                    // Reuse connections (reduces new-connection fingerprinting)
    maxConnections: 3,             // Don't hammer MX servers
    maxMessages: 10,               // Messages per connection before reconnecting
  });

  // Build RFC-compliant headers — ISPs flag emails missing these
  // Message-ID format mimics standard MTA patterns (not library-specific)
  const msgRandom = Array.from({ length: 12 }, () => Math.random().toString(36).charAt(2)).join('');
  const messageId = `<${msgRandom}.${Date.now().toString(36)}@${sendingDomain}>`;
  const mailHeaders: Record<string, string> = {
    'Message-ID': messageId,
    'MIME-Version': '1.0',
  };
  if (unsubscribeUrl) {
    mailHeaders['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
    mailHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }
  // Feedback-ID for ISP complaint tracking (Google FBL format)
  if (campaignId) {
    mailHeaders['Feedback-ID'] = `${campaignId}:${account.id}:blokblok`;
  }

  // Email threading — RFC 2822 In-Reply-To / References headers
  // Without these, sequence follow-ups show as separate emails in Gmail/Outlook
  // instead of threading into the same conversation. ISPs also flag non-threaded
  // sequences as cold outreach spam (real conversations always thread).
  if (inReplyTo) {
    mailHeaders['In-Reply-To'] = inReplyTo;
  }
  if (references) {
    mailHeaders['References'] = references;
  }

  // ARC (Authenticated Received Chain) — RFC 8617
  // When sending through Mailcow, Rspamd handles ARC signing automatically.
  // We add the Authentication-Results header that Mailcow's Rspamd will use
  // to generate ARC-Authentication-Results, ARC-Message-Signature, and ARC-Seal.
  // This preserves auth results when the email gets forwarded (e.g. Gmail→university).
  //
  // Without this header, forwarded emails lose SPF/DKIM context → spam folder.
  mailHeaders['X-Original-Authentication-Results'] = `${sendingDomain}; auth=pass smtp.auth=${account.smtpUser}`;

  // Precedence header — signals this is bulk/marketing email (not personal)
  // ISPs use this to properly categorize mail (promotions tab vs primary)
  // Being honest about bulk classification actually HELPS deliverability —
  // ISPs penalize mail that pretends to be personal but has bulk patterns
  mailHeaders['Precedence'] = 'bulk';

  // Auto-generate plain-text from HTML for multipart/alternative (critical for deliverability)
  // ISPs like Gmail penalize HTML-only emails — multipart/alternative boosts inbox placement
  const plainText = text || htmlToText(html);

  try {
    await transporter.sendMail({
      from: `Blok Blok Studio <${account.email}>`,
      to,
      replyTo: replyTo || account.email,
      subject,
      html,
      text: plainText,
      headers: mailHeaders,
      date: new Date(),            // Explicit Date header
      xMailer: false,              // CRITICAL: suppress X-Mailer header (ISPs fingerprint Nodemailer)
      priority: 'normal',          // Explicit priority (missing = bot signal)
      encoding: 'quoted-printable', // More natural than base64 for text emails
    } as Record<string, unknown>);

    // Log successful send event
    if (leadId) {
      await logEvent(leadId, 'sent', campaignId, account.id);
    }

    return { success: true, bounced: false, messageId };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SMTP] Failed to send via ${account.email} to ${to}:`, errMsg);

    // Enhanced bounce detection using SMTP codes + Enhanced Status Codes (RFC 3463)
    // ISPs return enhanced codes like 5.1.1, 5.7.1 etc. with different meanings:
    //   5.1.x = Address status (invalid user, bad syntax)
    //   5.2.x = Mailbox status (full, disabled, moved)
    //   5.3.x = Mail system problem (system full, not accepting mail)
    //   5.4.x = Network routing (no route, connection timeout)
    //   5.5.x = Protocol problem (wrong command, syntax error)
    //   5.7.x = Security/policy rejection (auth required, blocked by ISP)

    const errLower = errMsg.toLowerCase();

    // Check for enhanced status codes first (more specific)
    const enhancedCodeMatch = errMsg.match(/\b([245])\.\d+\.\d+\b/);
    const smtpCodeMatch = errMsg.match(/\b([245]\d{2})\b/);
    const smtpCode = smtpCodeMatch ? parseInt(smtpCodeMatch[1]) : 0;
    const enhancedClass = enhancedCodeMatch ? parseInt(enhancedCodeMatch[1]) : 0;

    // ISP policy rejection (5.7.x) = permanent suppress (ISP blocked you)
    const isPolicyReject = /\b5\.7\.\d+\b/.test(errMsg)
      || errLower.includes('blocked') || errLower.includes('policy')
      || errLower.includes('blacklist') || errLower.includes('not allowed')
      || errLower.includes('access denied') || errLower.includes('spam');

    // Hard bounce: permanent address failures
    const isHardBounce = /\b(550|551|553|554)\b/.test(errMsg)
      || /\b5\.1\.[1-8]\b/.test(errMsg)           // 5.1.x = invalid address
      || errLower.includes('user unknown') || errLower.includes('does not exist')
      || errLower.includes('no such user') || errLower.includes('mailbox not found')
      || errLower.includes('unknown recipient') || errLower.includes('recipient rejected')
      || errLower.includes('invalid recipient') || errLower.includes('undeliverable')
      || errLower.includes('no mailbox') || errLower.includes('user not found');

    // Soft bounce: temporary failures that may succeed on retry
    const isSoftBounce = !isHardBounce && !isPolicyReject && (
      /\b(421|450|451|452|552)\b/.test(errMsg)
      || /\b4\.\d+\.\d+\b/.test(errMsg)           // Any 4.x.x enhanced code
      || errLower.includes('mailbox full') || errLower.includes('over quota')
      || errLower.includes('try again') || errLower.includes('temporarily')
      || errLower.includes('deferred') || errLower.includes('rate limit')
      || errLower.includes('too many connections') || errLower.includes('greylisted')
      || errLower.includes('try later') || errLower.includes('service unavailable')
      || errLower.includes('connection timeout') || errLower.includes('timed out')
    );

    const isBounce = isHardBounce || isSoftBounce || isPolicyReject;

    if (isBounce && leadId) {
      // Policy rejections are treated as hard bounces (ISP blocked you — don't retry)
      const bounceType = isHardBounce || isPolicyReject ? 'hard' : 'soft';
      await logEvent(leadId, 'bounced', campaignId, account.id, `${bounceType}${isPolicyReject ? ' (policy)' : ''}: ${errMsg.slice(0, 200)}`);

      // Update lead bounce info
      try {
        await prisma.lead.update({
          where: { id: leadId },
          data: {
            bounceCount: { increment: 1 },
            lastBounceAt: new Date(),
            bounceType,
          },
        });
      } catch { /* lead might not exist */ }

      // Update campaign bounce count
      if (campaignId) {
        try {
          await prisma.emailCampaign.update({
            where: { id: campaignId },
            data: { bounceCount: { increment: 1 } },
          });
        } catch { /* campaign might not exist */ }
      }

      // Increment bounce count on sending log
      const today = new Date().toISOString().slice(0, 10);
      try {
        await prisma.sendingLog.upsert({
          where: { accountId_date: { accountId: account.id, date: today } },
          update: { bounced: { increment: 1 } },
          create: { accountId: account.id, date: today, sent: 0, bounced: 1 },
        });
      } catch { /* ignore */ }

      return { success: false, bounced: true, bounceType };
    }

    return { success: false, bounced: false };
  }
}

/**
 * Log an email event for analytics
 */
async function logEvent(
  leadId: string,
  type: string,
  campaignId?: string,
  accountId?: string,
  details?: string,
) {
  try {
    await prisma.emailEvent.create({
      data: { leadId, type, campaignId, accountId, details },
    });
  } catch { /* silently fail */ }
}

/**
 * Check if a campaign should be auto-paused due to bounces
 */
export async function checkBounceThreshold(campaignId: string): Promise<boolean> {
  try {
    const campaign = await prisma.emailCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign || campaign.status !== 'sending') return false;

    const totalSent = campaign.sentTo + campaign.bounceCount;
    if (totalSent === 0) return false;

    const bounceRate = (campaign.bounceCount / totalSent) * 100;
    if (bounceRate >= campaign.bounceThreshold) {
      await prisma.emailCampaign.update({
        where: { id: campaignId },
        data: { status: 'paused' },
      });
      console.warn(`[BOUNCE] Campaign ${campaignId} auto-paused: ${bounceRate.toFixed(1)}% bounce rate`);
      return true;
    }
  } catch { /* ignore */ }
  return false;
}

/**
 * Detect the ISP group of an email for ESP matching.
 * Gmail→Gmail, Outlook→Outlook routing improves inbox placement by 10-16%.
 */
function getAccountIspGroup(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() || '';
  if (['gmail.com', 'googlemail.com'].includes(domain)) return 'google';
  if (['outlook.com', 'hotmail.com', 'live.com', 'msn.com'].includes(domain)) return 'microsoft';
  if (['yahoo.com', 'yahoo.co.uk', 'ymail.com', 'aol.com'].includes(domain)) return 'yahoo';
  // Google Workspace domains use MX records like *.google.com
  // For now, check common patterns
  return 'other';
}

/**
 * Pick the next available sending account.
 * Uses ESP matching when possible (Gmail→Gmail improves inbox placement 10-16%).
 * Falls back to round-robin if no matching ESP account is available.
 * Respects send windows, weekday restrictions, and daily volume randomization.
 */
export async function getNextAccount(recipientEmail?: string): Promise<SendingAccountData | null> {
  const today = new Date().toISOString().slice(0, 10);
  const nowHour = new Date().getUTCHours();
  const dayOfWeek = new Date().getUTCDay();

  const accounts = await prisma.sendingAccount.findMany({
    where: { active: true },
    orderBy: { sentToday: 'asc' },
  });

  if (accounts.length === 0) return null;

  // ESP matching: prefer accounts matching the recipient's ISP
  // Gmail→Gmail and Outlook→Outlook improves inbox placement by 10-16%
  const recipientIsp = recipientEmail ? getAccountIspGroup(recipientEmail) : null;
  const sortedAccounts = recipientIsp && recipientIsp !== 'other'
    ? [
        ...accounts.filter(a => getAccountIspGroup(a.email) === recipientIsp),
        ...accounts.filter(a => getAccountIspGroup(a.email) !== recipientIsp),
      ]
    : accounts;

  for (const acct of sortedAccounts) {
    const account = acct as typeof acct & { sendWindowStart?: number; sendWindowEnd?: number; sendWeekdays?: string };

    // Check send window (skip accounts outside their window)
    if (typeof account.sendWindowStart === 'number' && typeof account.sendWindowEnd === 'number') {
      if (nowHour < account.sendWindowStart || nowHour >= account.sendWindowEnd) continue;
    }
    if (account.sendWeekdays) {
      const allowedDays = account.sendWeekdays.split(',').map(d => parseInt(d));
      if (!allowedDays.includes(dayOfWeek)) continue;
    }

    // Reset daily counter
    const lastReset = account.lastResetAt.toISOString().slice(0, 10);
    if (lastReset !== today) {
      await prisma.sendingAccount.update({
        where: { id: account.id },
        data: { sentToday: 0, lastResetAt: new Date() },
      });
      account.sentToday = 0;
    }

    // Auto-advance warmup phase — gated on BOTH calendar time AND engagement metrics
    // This prevents scaling volume when the domain hasn't earned trust yet.
    // A domain with low open rates or high bounces stays at current phase regardless of time.
    const daysSinceStart = Math.floor(
      (Date.now() - account.warmupStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Calculate engagement metrics from recent sending logs
    const recentLogs = await prisma.sendingLog.findMany({
      where: { accountId: account.id },
      orderBy: { date: 'desc' },
      take: 7,
    });
    const recentSent = recentLogs.reduce((s, l) => s + l.sent, 0);
    const recentBounced = recentLogs.reduce((s, l) => s + l.bounced, 0);
    const accountBounceRate = recentSent > 0 ? (recentBounced / recentSent) * 100 : 0;

    // Calculate open rate from recent events for this account
    let accountOpenRate = 0;
    if (recentSent > 5) {
      try {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [sentEvents, openEvents] = await Promise.all([
          prisma.emailEvent.count({ where: { accountId: account.id, type: 'sent', createdAt: { gte: sevenDaysAgo } } }),
          prisma.emailEvent.count({ where: { accountId: account.id, type: 'opened', createdAt: { gte: sevenDaysAgo } } }),
        ]);
        accountOpenRate = sentEvents > 0 ? (openEvents / sentEvents) * 100 : 0;
      } catch { /* email events may not have accountId index yet */ }
    }

    // Calculate health score (same formula as getWarmupStats)
    const avgDaily = recentLogs.length > 0
      ? recentLogs.reduce((s, l) => s + l.sent, 0) / recentLogs.length
      : 0;
    const currentPhaseConfig = WARMUP_PHASES[account.warmupPhase] || WARMUP_PHASES[1];
    const consistency = recentLogs.length >= 3 ? Math.min(avgDaily / (currentPhaseConfig.dailyLimit * 0.5), 1) : 0;
    const bouncePenalty = Math.max(0, 1 - (accountBounceRate / 10));
    const healthScore = Math.round(consistency * bouncePenalty * 100);

    let newPhase = account.warmupPhase;
    for (const [phase, config] of Object.entries(WARMUP_PHASES).reverse()) {
      const phaseNum = parseInt(phase);
      if (phaseNum <= account.warmupPhase) break; // Only check higher phases

      // Calendar time gate
      if (daysSinceStart < config.daysRequired) continue;

      // Engagement gates — must meet ALL thresholds to advance
      if (accountOpenRate < config.minOpenRate && recentSent > 10) {
        console.log(`[Warmup] ${account.email}: Phase ${phaseNum} blocked — open rate ${accountOpenRate.toFixed(1)}% < ${config.minOpenRate}% required`);
        continue;
      }
      if (healthScore < config.minHealthScore && recentLogs.length >= 3) {
        console.log(`[Warmup] ${account.email}: Phase ${phaseNum} blocked — health score ${healthScore} < ${config.minHealthScore} required`);
        continue;
      }
      if (accountBounceRate > config.maxBounceRate && recentSent > 5) {
        console.log(`[Warmup] ${account.email}: Phase ${phaseNum} blocked — bounce rate ${accountBounceRate.toFixed(1)}% > ${config.maxBounceRate}% max`);
        continue;
      }

      newPhase = phaseNum;
      break;
    }
    if (newPhase !== account.warmupPhase) {
      console.log(`[Warmup] ${account.email}: Advancing to Phase ${newPhase} (open=${accountOpenRate.toFixed(1)}%, health=${healthScore}, bounce=${accountBounceRate.toFixed(1)}%)`);
      await prisma.sendingAccount.update({
        where: { id: account.id },
        data: { warmupPhase: newPhase, dailyLimit: WARMUP_PHASES[newPhase].dailyLimit },
      });
      account.dailyLimit = WARMUP_PHASES[newPhase].dailyLimit;
    }

    // Daily volume randomization: ±15% variation prevents bot pattern detection
    // Sending exactly 100 every day = mechanical pattern. Sending 87-115 = human.
    // The randomized limit is deterministic per account+day so it stays consistent within a day.
    const dayHash = (account.id.charCodeAt(0) + parseInt(today.replace(/-/g, ''))) % 100;
    const jitterPercent = ((dayHash / 100) * 0.3) - 0.15; // -15% to +15%
    const randomizedLimit = Math.round(account.dailyLimit * (1 + jitterPercent));

    if (account.sentToday < randomizedLimit) {
      return account;
    }
  }

  return null;
}

/**
 * Increment the daily send counter and log for an account.
 */
export async function recordSend(accountId: string): Promise<void> {
  const today = new Date().toISOString().slice(0, 10);

  await prisma.sendingAccount.update({
    where: { id: accountId },
    data: { sentToday: { increment: 1 } },
  });

  await prisma.sendingLog.upsert({
    where: { accountId_date: { accountId, date: today } },
    update: { sent: { increment: 1 } },
    create: { accountId, date: today, sent: 1 },
  });
}

/**
 * Get warmup stats for all accounts.
 */
export async function getWarmupStats() {
  const accounts = await prisma.sendingAccount.findMany({
    where: { active: true },
    include: {
      dailyLogs: {
        orderBy: { date: 'desc' },
        take: 30,
      },
    },
  });

  return accounts.map(account => {
    const daysSinceStart = Math.floor(
      (Date.now() - account.warmupStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const phase = WARMUP_PHASES[account.warmupPhase] || WARMUP_PHASES[1];
    const totalSent = account.dailyLogs.reduce((sum, log) => sum + log.sent, 0);
    const totalBounced = account.dailyLogs.reduce((sum, log) => sum + log.bounced, 0);

    const recentLogs = account.dailyLogs.slice(0, 7);
    const avgDaily = recentLogs.length > 0
      ? recentLogs.reduce((s, l) => s + l.sent, 0) / recentLogs.length
      : 0;
    const bounceRate = totalSent > 0 ? (totalBounced / totalSent) * 100 : 0;
    const consistency = recentLogs.length >= 3 ? Math.min(avgDaily / (phase.dailyLimit * 0.5), 1) : 0;
    const bouncePenalty = Math.max(0, 1 - (bounceRate / 10));
    const healthScore = Math.round(consistency * bouncePenalty * 100);

    return {
      id: account.id,
      label: account.label,
      email: account.email,
      warmupPhase: account.warmupPhase,
      phaseLabel: phase.label,
      dailyLimit: account.dailyLimit,
      sentToday: account.sentToday,
      daysSinceStart,
      totalSent,
      totalBounced,
      bounceRate: Math.round(bounceRate * 10) / 10,
      healthScore,
      dailyLogs: account.dailyLogs.map(l => ({ date: l.date, sent: l.sent, bounced: l.bounced })),
    };
  });
}

import nodemailer from 'nodemailer';
import { prisma } from './prisma';
import { decrypt } from './crypto';

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

// Warmup phase limits
export const WARMUP_PHASES: Record<number, { dailyLimit: number; label: string; daysRequired: number }> = {
  1: { dailyLimit: 5, label: 'Phase 1 — Getting Started', daysRequired: 0 },
  2: { dailyLimit: 15, label: 'Phase 2 — Building Trust', daysRequired: 7 },
  3: { dailyLimit: 30, label: 'Phase 3 — Growing Volume', daysRequired: 14 },
  4: { dailyLimit: 50, label: 'Phase 4 — Scaling Up', daysRequired: 28 },
  5: { dailyLimit: 100, label: 'Phase 5 — Full Speed', daysRequired: 42 },
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
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    unsubscribeUrl?: string;
    leadId?: string;
    campaignId?: string;
  }
): Promise<{ success: boolean; bounced: boolean; bounceType?: string }> {
  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: {
      user: account.smtpUser,
      pass: decrypt(account.smtpPass), // Decrypt from AES-256-GCM
    },
  });

  const mailHeaders: Record<string, string> = {};
  if (unsubscribeUrl) {
    mailHeaders['List-Unsubscribe'] = `<${unsubscribeUrl}>`;
    mailHeaders['List-Unsubscribe-Post'] = 'List-Unsubscribe=One-Click';
  }

  try {
    await transporter.sendMail({
      from: `Blok Blok Studio <${account.email}>`,
      to,
      replyTo: replyTo || account.email,
      subject,
      html,
      text: text || undefined,
      headers: mailHeaders,
    });

    // Log successful send event
    if (leadId) {
      await logEvent(leadId, 'sent', campaignId, account.id);
    }

    return { success: true, bounced: false };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error(`[SMTP] Failed to send via ${account.email} to ${to}:`, errMsg);

    // Detect bounce types from SMTP error codes
    const isBounce = errMsg.includes('550') || errMsg.includes('551') || errMsg.includes('552')
      || errMsg.includes('553') || errMsg.includes('554') || errMsg.includes('User unknown')
      || errMsg.includes('does not exist') || errMsg.includes('invalid') || errMsg.includes('rejected');

    const isHardBounce = errMsg.includes('550') || errMsg.includes('551') || errMsg.includes('553')
      || errMsg.includes('User unknown') || errMsg.includes('does not exist');

    if (isBounce && leadId) {
      const bounceType = isHardBounce ? 'hard' : 'soft';
      await logEvent(leadId, 'bounced', campaignId, account.id, `${bounceType}: ${errMsg.slice(0, 200)}`);

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
 * Pick the next available sending account using round-robin.
 * Respects send windows and weekday restrictions.
 */
export async function getNextAccount(): Promise<SendingAccountData | null> {
  const today = new Date().toISOString().slice(0, 10);
  const nowHour = new Date().getUTCHours();
  const dayOfWeek = new Date().getUTCDay();

  const accounts = await prisma.sendingAccount.findMany({
    where: { active: true },
    orderBy: { sentToday: 'asc' },
  });

  if (accounts.length === 0) return null;

  for (const acct of accounts) {
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

    // Auto-advance warmup phase
    const daysSinceStart = Math.floor(
      (Date.now() - account.warmupStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    let newPhase = account.warmupPhase;
    for (const [phase, config] of Object.entries(WARMUP_PHASES).reverse()) {
      if (daysSinceStart >= config.daysRequired) {
        newPhase = parseInt(phase);
        break;
      }
    }
    if (newPhase !== account.warmupPhase) {
      await prisma.sendingAccount.update({
        where: { id: account.id },
        data: { warmupPhase: newPhase, dailyLimit: WARMUP_PHASES[newPhase].dailyLimit },
      });
      account.dailyLimit = WARMUP_PHASES[newPhase].dailyLimit;
    }

    if (account.sentToday < account.dailyLimit) {
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

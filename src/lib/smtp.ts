import nodemailer from 'nodemailer';
import { prisma } from './prisma';

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
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
    replyTo?: string;
    unsubscribeUrl?: string;
  }
): Promise<boolean> {
  const transporter = nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465,
    auth: {
      user: account.smtpUser,
      pass: account.smtpPass,
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
    return true;
  } catch (err) {
    console.error(`[SMTP] Failed to send via ${account.email} to ${to}:`, err);
    return false;
  }
}

/**
 * Pick the next available sending account using round-robin.
 * Respects daily limits and warmup phase limits.
 * Resets daily counters if a new day has started.
 */
export async function getNextAccount(): Promise<SendingAccountData | null> {
  const today = new Date().toISOString().slice(0, 10);

  // Get all active accounts
  const accounts = await prisma.sendingAccount.findMany({
    where: { active: true },
    orderBy: { sentToday: 'asc' }, // Least-sent-today first (spreads load)
  });

  if (accounts.length === 0) return null;

  for (const account of accounts) {
    // Reset daily counter if new day
    const lastReset = account.lastResetAt.toISOString().slice(0, 10);
    if (lastReset !== today) {
      await prisma.sendingAccount.update({
        where: { id: account.id },
        data: { sentToday: 0, lastResetAt: new Date() },
      });
      account.sentToday = 0;
    }

    // Auto-advance warmup phase based on days since start
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

    // Check if under daily limit
    if (account.sentToday < account.dailyLimit) {
      return account;
    }
  }

  return null; // All accounts maxed out for today
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
        take: 30, // Last 30 days
      },
    },
  });

  return accounts.map(account => {
    const daysSinceStart = Math.floor(
      (Date.now() - account.warmupStart.getTime()) / (1000 * 60 * 60 * 24)
    );
    const phase = WARMUP_PHASES[account.warmupPhase] || WARMUP_PHASES[1];
    const totalSent = account.dailyLogs.reduce((sum, log) => sum + log.sent, 0);

    // Health score: based on consistency and not exceeding limits
    const recentLogs = account.dailyLogs.slice(0, 7);
    const avgDaily = recentLogs.length > 0
      ? recentLogs.reduce((s, l) => s + l.sent, 0) / recentLogs.length
      : 0;
    const consistency = recentLogs.length >= 3 ? Math.min(avgDaily / (phase.dailyLimit * 0.5), 1) : 0;
    const healthScore = Math.round(consistency * 100);

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
      healthScore,
      dailyLogs: account.dailyLogs.map(l => ({ date: l.date, sent: l.sent })),
    };
  });
}

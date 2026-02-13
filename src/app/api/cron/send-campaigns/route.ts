import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCampaignEmail } from '@/lib/email';
import { injectTracking } from '@/lib/tracking';
import { buildEmailHtml } from '@/app/api/admin/campaign/route';
import { getNextAccount, sendViaSMTP, recordSend, checkBounceThreshold } from '@/lib/smtp';
import { processSpintax, pickVariant } from '@/lib/verify';
import { isLeadEligible, checkRateLimit, checkIspRateLimit, checkContentFingerprint, reportSendSuccess, reportSendError, checkCampaignHealth, queueSoftBounceRetry, recordDailySnapshot, getEngagementTier, getHumanizedDelay, validateEmailLinks, checkDmarcEnforcement, isGoodSendTime } from '@/lib/deliverability';
import { htmlToText } from '@/lib/email';
import { applyStylometricVariation } from '@/lib/stylometry';

/**
 * Cron job — runs daily at 8am UTC.
 * 1. Processes scheduled campaigns that have reached their send time
 * 2. Processes active sequence enrollments that are due
 * 3. Uses SMTP accounts with rotation when available, falls back to Resend
 * 4. Injects open/click tracking into all outgoing emails
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const results: Record<string, unknown>[] = [];

  // ── 1. Process scheduled campaigns ──
  const campaigns = await prisma.emailCampaign.findMany({
    where: {
      status: 'scheduled',
      scheduledAt: { lte: now },
    },
    orderBy: { createdAt: 'asc' },
    take: 5,
  });

  for (const campaign of campaigns) {
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'sending' },
    });

    const leadIdList = campaign.leadIds ? JSON.parse(campaign.leadIds) as string[] : null;

    // Deliverability-safe lead query
    const allLeads = await prisma.lead.findMany({
      where: leadIdList && leadIdList.length > 0
        ? { id: { in: leadIdList }, unsubscribed: false }
        : { unsubscribed: false },
      select: { id: true, email: true, name: true, field: true, website: true, problem: true, emailsSent: true, verifyResult: true, bounceType: true, bounceCount: true, complainedAt: true, engagementScore: true, lastEngagedAt: true },
    });

    // Filter out ineligible leads (complained, hard-bounced, invalid, disposable, catch-all, role-based)
    const rolePatterns = /^(info|admin|abuse|noreply|no-reply|postmaster|webmaster|hostmaster|support|security|sales|contact|help|billing)@/i;
    const validLeads = allLeads.filter(l => {
      if (l.complainedAt) return false; // Complaint suppression
      if (l.bounceType === 'hard' || l.bounceCount >= 3) return false; // Hard bounce
      if (l.verifyResult === 'invalid' || l.verifyResult === 'disposable' || l.verifyResult === 'catch_all') return false;
      if (rolePatterns.test(l.email)) return false; // Role-based addresses
      return true;
    });

    // Parse A/B variants if present
    const variants = campaign.variants ? JSON.parse(campaign.variants) as { subject: string; body: string; weight: number }[] : null;

    let sentCount = 0;
    for (const lead of validLeads) {
      // Global rate limit check
      const rl = checkRateLimit();
      if (!rl.allowed) {
        if (rl.waitMs > 5000) break;
        await new Promise(r => setTimeout(r, rl.waitMs));
      }

      // Per-ISP rate limit check (Gmail=100/hr, Yahoo=50/hr, etc.)
      const ispCheck = checkIspRateLimit(lead.email);
      if (!ispCheck.allowed) {
        console.log(`[Cron] ISP limit for ${ispCheck.isp} — skipping ${lead.email}, retry next run`);
        continue; // Skip this lead, don't break the whole campaign
      }

      // Check bounce threshold mid-campaign
      const paused = await checkBounceThreshold(campaign.id);
      if (paused) break;

      // Check campaign health (bounce + unsub + complaint rates)
      if (sentCount > 0 && sentCount % 5 === 0) {
        const health = await checkCampaignHealth(campaign.id);
        if (health.shouldPause) {
          console.warn(`[Cron] Campaign ${campaign.id} auto-paused: ${health.reason}`);
          break;
        }
      }

      // Pick A/B variant or use default
      const content = variants && variants.length > 0 ? pickVariant(variants) : { subject: campaign.subject, body: campaign.body };

      // Process spintax, then apply stylometric variation to defeat ISP LLM detection
      const rawSubject = processSpintax(content.subject);
      const rawBody = applyStylometricVariation(processSpintax(content.body), 0.5);

      const html = buildEmailHtml(rawBody, lead);
      const subject = rawSubject
        .replace(/\{\{name\}\}/g, lead.name)
        .replace(/\{\{email\}\}/g, lead.email)
        .replace(/\{\{field\}\}/g, lead.field)
        .replace(/\{\{website\}\}/g, lead.website || 'N/A')
        .replace(/\{\{problem\}\}/g, lead.problem);

      // Content fingerprint check — prevent ISPs from flagging identical template spam
      const fpCheck = checkContentFingerprint(html);
      if (!fpCheck.allowed) {
        console.warn(`[Cron] Template spam guard: ${fpCheck.similarSent} identical sends — ${fpCheck.suggestion}`);
        await new Promise(r => setTimeout(r, 5000 + Math.random() * 5000));
      }

      // Link validation — broken links are a spam signal
      const linkCheck = validateEmailLinks(html);
      if (!linkCheck.valid && linkCheck.brokenLinks.length > 0) {
        console.warn(`[Cron] Broken links found: ${linkCheck.brokenLinks.map(l => `${l.url} (${l.reason})`).join(', ')}`);
      }

      // DMARC enforcement gate — check before sending to strict ISPs
      const dmarcCheck = await checkDmarcEnforcement(lead.email);
      if (!dmarcCheck.allowed) {
        console.warn(`[Cron] DMARC blocked: ${dmarcCheck.reason}`);
        continue; // Skip this lead — DMARC not configured
      }

      // Timezone-aware sending — defer if outside recipient's business hours
      const tzCheck = isGoodSendTime(lead.email);
      if (!tzCheck.shouldSend) {
        // Don't skip — just log. The cron will catch them on the next run.
        console.log(`[Cron] Timezone defer: ${lead.email} — ${tzCheck.reason}`);
        continue;
      }

      const sendResult = await sendWithRotation(lead.email, subject, html, lead.id, campaign.id);
      if (sendResult.sent) {
        sentCount++;
        await prisma.lead.update({
          where: { id: lead.id },
          data: { emailsSent: { increment: 1 }, lastEmailAt: new Date(), status: lead.emailsSent === 0 ? 'contacted' : undefined },
        });
      }

      // Human-like delay: combines engagement tier + burst/pause patterns + jitter
      const tier = getEngagementTier(
        lead.engagementScore ?? 0,
        lead.lastEngagedAt,
        lead.emailsSent
      );
      const delay = getHumanizedDelay(tier, sentCount);
      await new Promise(r => setTimeout(r, delay));
    }

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { sentTo: sentCount, sentAt: new Date(), status: sentCount > 0 ? 'sent' : 'failed' },
    });

    results.push({ type: 'campaign', id: campaign.id, sentTo: sentCount, total: validLeads.length, filtered: allLeads.length - validLeads.length });
  }

  // ── 2. Process sequence enrollments ──
  const enrollments = await prisma.sequenceEnrollment.findMany({
    where: {
      status: 'active',
      nextSendAt: { lte: now },
    },
    take: 50,
  });

  let seqSent = 0;
  for (const enrollment of enrollments) {
    const sequence = await prisma.sequence.findUnique({
      where: { id: enrollment.sequenceId },
      include: { steps: { orderBy: { order: 'asc' } } },
    });

    if (!sequence || !sequence.active) {
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'paused' },
      });
      continue;
    }

    const nextStepIndex = enrollment.currentStep; // 0-based index into steps
    const step = sequence.steps[nextStepIndex];

    if (!step) {
      // All steps completed
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'completed', nextSendAt: null },
      });
      continue;
    }

    const lead = await prisma.lead.findUnique({ where: { id: enrollment.leadId } });
    if (!lead || lead.unsubscribed) {
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'unsubscribed', nextSendAt: null },
      });
      continue;
    }

    // Deliverability check: skip ineligible leads
    const eligibility = await isLeadEligible(enrollment.leadId);
    if (!eligibility.eligible) {
      // Don't permanently remove from sequence — just skip this round
      const nextRetry = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Try again tomorrow
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { nextSendAt: nextRetry },
      });
      continue;
    }

    // Personalize and send (with spintax + stylometric variation)
    const html = buildEmailHtml(applyStylometricVariation(processSpintax(step.body), 0.5), lead);
    const subject = processSpintax(step.subject)
      .replace(/\{\{name\}\}/g, lead.name)
      .replace(/\{\{email\}\}/g, lead.email)
      .replace(/\{\{field\}\}/g, lead.field)
      .replace(/\{\{website\}\}/g, lead.website || 'N/A')
      .replace(/\{\{problem\}\}/g, lead.problem);

    // Per-ISP rate limit check for sequence sends
    const seqIspCheck = checkIspRateLimit(lead.email);
    if (!seqIspCheck.allowed) {
      // Reschedule for later instead of skipping
      const nextRetry = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2h later
      await prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { nextSendAt: nextRetry },
      });
      continue;
    }

    // Email threading: look up previous Message-ID for this lead's sequence
    // This makes follow-ups appear in the same Gmail/Outlook conversation thread
    let threadingHeaders: { inReplyTo?: string; references?: string } | undefined;
    if (nextStepIndex > 0) {
      try {
        const prevEvent = await prisma.emailEvent.findFirst({
          where: {
            leadId: enrollment.leadId,
            type: 'sent',
            details: { startsWith: 'msgid:' },
          },
          orderBy: { createdAt: 'desc' },
        });
        if (prevEvent?.details) {
          const prevMsgId = prevEvent.details.replace('msgid:', '');
          threadingHeaders = {
            inReplyTo: prevMsgId,
            references: prevMsgId, // Full chain would collect all previous IDs
          };
        }
      } catch { /* threading is best-effort */ }
    }

    const sendResult = await sendWithRotation(lead.email, subject, html, lead.id, undefined, threadingHeaders);

    if (sendResult.sent) {
      // Store Message-ID for future threading
      if (sendResult.messageId) {
        try {
          await prisma.emailEvent.create({
            data: {
              leadId: lead.id,
              type: 'sent',
              details: `msgid:${sendResult.messageId}`,
            },
          });
        } catch { /* threading storage is best-effort */ }
      }
      seqSent++;
      await prisma.lead.update({
        where: { id: lead.id },
        data: { emailsSent: { increment: 1 }, lastEmailAt: new Date() },
      });

      // Auto-set status to "contacted" on first email
      if (lead.emailsSent === 0) {
        try {
          await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'contacted' },
          });
        } catch { /* column may not exist yet */ }
      }

      // Advance to next step
      const nextStep = sequence.steps[nextStepIndex + 1];
      if (nextStep) {
        const nextSend = new Date(now.getTime() + nextStep.delayDays * 24 * 60 * 60 * 1000);
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { currentStep: nextStepIndex + 1, nextSendAt: nextSend },
        });
      } else {
        // Sequence complete — mark enrollment as completed
        await prisma.sequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { status: 'completed', currentStep: nextStepIndex + 1, nextSendAt: null },
        });

        // Log completion event
        try {
          await prisma.emailEvent.create({
            data: {
              leadId: lead.id,
              type: 'sequence_completed',
              details: `Completed sequence "${sequence.name}" (${sequence.steps.length} steps)`,
            },
          });
        } catch { /* table may not exist yet */ }
      }
    }

    // Human-like delay for sequence sends too
    const seqTier = getEngagementTier(lead.engagementScore ?? 0, lead.lastEngagedAt, lead.emailsSent);
    const seqDelay = getHumanizedDelay(seqTier, seqSent);
    await new Promise(r => setTimeout(r, seqDelay));
  }

  if (seqSent > 0) {
    results.push({ type: 'sequences', sent: seqSent, processed: enrollments.length });
  }

  // ── 3. Process soft bounce retry queue ──
  const retryQueue = await prisma.softBounceQueue.findMany({
    where: { nextRetry: { lte: now }, retries: { lt: 3 } },
    take: 20,
  });

  let retrySent = 0;
  for (const item of retryQueue) {
    const retryResult = await sendWithRotation(item.email, item.subject, item.html, item.leadId, item.campaignId || undefined);
    if (retryResult.sent) {
      retrySent++;
      await prisma.softBounceQueue.delete({ where: { id: item.id } });
    } else {
      // Increment retry and reschedule
      const retryDelays = [6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000, 48 * 60 * 60 * 1000];
      const nextRetry = new Date(Date.now() + (retryDelays[item.retries] || retryDelays[2]));
      await prisma.softBounceQueue.update({
        where: { id: item.id },
        data: { retries: item.retries + 1, nextRetry },
      });
    }
  }

  if (retryQueue.length > 0) {
    results.push({ type: 'soft-bounce-retries', retried: retryQueue.length, succeeded: retrySent });
  }

  // ── 4. Record daily deliverability snapshot ──
  try {
    await recordDailySnapshot();
  } catch (err) {
    console.error('[Cron] Snapshot failed:', err);
  }

  return NextResponse.json({
    message: `Processed ${campaigns.length} campaign(s), ${enrollments.length} sequence step(s), ${retryQueue.length} retry(s)`,
    results,
  });
}

/**
 * Try SMTP accounts first (with rotation + ESP matching), fall back to Resend.
 * Injects open/click tracking into the HTML before sending.
 * Supports email threading via In-Reply-To/References for sequence follow-ups.
 */
async function sendWithRotation(
  to: string,
  subject: string,
  html: string,
  leadId: string,
  campaignId?: string,
  threadingHeaders?: { inReplyTo?: string; references?: string },
): Promise<{ sent: boolean; messageId?: string }> {
  // Inject tracking pixel and link wrapping
  const trackedHtml = injectTracking(html, leadId, campaignId);

  // ESP matching: pass recipient email so getNextAccount prefers same-ISP accounts
  const account = await getNextAccount(to);
  if (account) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?id=${leadId}`;

    const result = await sendViaSMTP(account, {
      to,
      subject,
      html: trackedHtml,
      unsubscribeUrl,
      leadId,
      campaignId,
      inReplyTo: threadingHeaders?.inReplyTo,
      references: threadingHeaders?.references,
    });

    if (result.success) {
      await recordSend(account.id);
      return { sent: true, messageId: result.messageId };
    }
    // If bounced, don't fall back — the email is definitely bad
    if (result.bounced) return { sent: false };
  }

  // Fall back to Resend
  const ok = await sendCampaignEmail({ to, subject, html: trackedHtml, leadId });
  return { sent: ok };
}

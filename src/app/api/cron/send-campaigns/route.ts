import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCampaignEmail } from '@/lib/email';
import { buildEmailHtml } from '@/app/api/admin/campaign/route';
import { getNextAccount, sendViaSMTP, recordSend, checkBounceThreshold } from '@/lib/smtp';
import { processSpintax, pickVariant } from '@/lib/verify';

/**
 * Cron job — runs daily at 8am UTC.
 * 1. Processes scheduled campaigns that have reached their send time
 * 2. Processes active sequence enrollments that are due
 * 3. Uses SMTP accounts with rotation when available, falls back to Resend
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
    const where = leadIdList && leadIdList.length > 0
      ? { id: { in: leadIdList }, unsubscribed: false }
      : { unsubscribed: false };

    const leads = await prisma.lead.findMany({
      where,
      select: { id: true, email: true, name: true, field: true, website: true, problem: true, emailsSent: true },
    });

    // Parse A/B variants if present
    const variants = campaign.variants ? JSON.parse(campaign.variants) as { subject: string; body: string; weight: number }[] : null;

    let sentCount = 0;
    for (const lead of leads) {
      // Check bounce threshold mid-campaign
      const paused = await checkBounceThreshold(campaign.id);
      if (paused) break;

      // Pick A/B variant or use default
      const content = variants && variants.length > 0 ? pickVariant(variants) : { subject: campaign.subject, body: campaign.body };

      // Process spintax
      const rawSubject = processSpintax(content.subject);
      const rawBody = processSpintax(content.body);

      const html = buildEmailHtml(rawBody, lead);
      const subject = rawSubject
        .replace(/\{\{name\}\}/g, lead.name)
        .replace(/\{\{email\}\}/g, lead.email)
        .replace(/\{\{field\}\}/g, lead.field)
        .replace(/\{\{website\}\}/g, lead.website || 'N/A')
        .replace(/\{\{problem\}\}/g, lead.problem);

      const ok = await sendWithRotation(lead.email, subject, html, lead.id, campaign.id);
      if (ok) {
        sentCount++;
        await prisma.lead.update({
          where: { id: lead.id },
          data: { emailsSent: { increment: 1 }, lastEmailAt: new Date(), status: lead.emailsSent === 0 ? 'contacted' : undefined },
        });
      }
      await new Promise(r => setTimeout(r, 200));
    }

    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { sentTo: sentCount, sentAt: new Date(), status: sentCount > 0 ? 'sent' : 'failed' },
    });

    results.push({ type: 'campaign', id: campaign.id, sentTo: sentCount, total: leads.length });
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

    // Personalize and send (with spintax)
    const html = buildEmailHtml(processSpintax(step.body), lead);
    const subject = processSpintax(step.subject)
      .replace(/\{\{name\}\}/g, lead.name)
      .replace(/\{\{email\}\}/g, lead.email)
      .replace(/\{\{field\}\}/g, lead.field)
      .replace(/\{\{website\}\}/g, lead.website || 'N/A')
      .replace(/\{\{problem\}\}/g, lead.problem);

    const ok = await sendWithRotation(lead.email, subject, html, lead.id);

    if (ok) {
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

    await new Promise(r => setTimeout(r, 200));
  }

  if (seqSent > 0) {
    results.push({ type: 'sequences', sent: seqSent, processed: enrollments.length });
  }

  return NextResponse.json({
    message: `Processed ${campaigns.length} campaign(s), ${enrollments.length} sequence step(s)`,
    results,
  });
}

/**
 * Try SMTP accounts first (with rotation), fall back to Resend.
 */
async function sendWithRotation(to: string, subject: string, html: string, leadId: string, campaignId?: string): Promise<boolean> {
  const account = await getNextAccount();
  if (account) {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');
    const unsubscribeUrl = `${baseUrl}/api/unsubscribe?id=${leadId}`;

    const result = await sendViaSMTP(account, {
      to,
      subject,
      html,
      unsubscribeUrl,
      leadId,
      campaignId,
    });

    if (result.success) {
      await recordSend(account.id);
      return true;
    }
    // If bounced, don't fall back — the email is definitely bad
    if (result.bounced) return false;
  }

  // Fall back to Resend
  return sendCampaignEmail({ to, subject, html, leadId });
}

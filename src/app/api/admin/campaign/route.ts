import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';
import { sendCampaignEmail } from '@/lib/email';

/**
 * POST /api/admin/campaign — create & queue a campaign
 * Returns immediately (fixes INP). Emails are sent by the cron processor
 * or inline for small batches (< 5 leads).
 */
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { subject, body, leadIds, scheduledAt, variants } = await req.json();

  if (!subject || !body) {
    return NextResponse.json({ error: 'Missing subject or body' }, { status: 400 });
  }

  // Count target leads
  const where = leadIds && leadIds.length > 0
    ? { id: { in: leadIds }, unsubscribed: false }
    : { unsubscribed: false };

  const leads = await prisma.lead.findMany({
    where,
    select: { id: true, email: true, name: true, field: true, website: true, problem: true },
  });

  if (leads.length === 0) {
    return NextResponse.json({ error: 'No active leads to send to' }, { status: 400 });
  }

  // Determine status based on scheduling
  const isScheduled = scheduledAt && new Date(scheduledAt) > new Date();

  // Create campaign record
  const campaign = await prisma.emailCampaign.create({
    data: {
      subject,
      body,
      totalLeads: leads.length,
      leadIds: leadIds ? JSON.stringify(leadIds) : null,
      scheduledAt: isScheduled ? new Date(scheduledAt) : null,
      status: isScheduled ? 'scheduled' : 'sending',
      variants: variants || null,
    },
  });

  // Scheduled campaigns — daily cron picks them up at 8am UTC
  if (isScheduled) {
    return NextResponse.json({
      success: true,
      campaignId: campaign.id,
      sentTo: 0,
      total: leads.length,
      status: 'scheduled',
      message: `Campaign scheduled for ${new Date(scheduledAt).toLocaleString()}`,
    });
  }

  // Send immediately (all sizes)
  let sentCount = 0;
  for (const lead of leads) {
    const html = buildEmailHtml(body, lead);
    const personalizedSubject = personalizeText(subject, lead);
    const ok = await sendCampaignEmail({ to: lead.email, subject: personalizedSubject, html, leadId: lead.id });
    if (ok) {
      sentCount++;
      await prisma.lead.update({
        where: { id: lead.id },
        data: { emailsSent: { increment: 1 }, lastEmailAt: new Date() },
      });
    }
  }

  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: { sentTo: sentCount, sentAt: new Date(), status: 'sent' },
  });

  return NextResponse.json({
    success: true,
    campaignId: campaign.id,
    sentTo: sentCount,
    total: leads.length,
  });
}

// GET /api/admin/campaign — list past campaigns
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const campaigns = await prisma.emailCampaign.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ campaigns });
}

// ── Helpers ──

interface LeadData {
  name: string;
  email: string;
  field: string;
  website: string | null;
  problem: string;
}

function personalizeText(text: string, lead: LeadData): string {
  return text
    .replace(/\{\{name\}\}/g, lead.name)
    .replace(/\{\{email\}\}/g, lead.email)
    .replace(/\{\{field\}\}/g, lead.field)
    .replace(/\{\{website\}\}/g, lead.website || 'N/A')
    .replace(/\{\{problem\}\}/g, lead.problem);
}

export function buildEmailHtml(bodyTemplate: string, lead: LeadData & { id?: string }): string {
  const personalizedBody = personalizeText(bodyTemplate, lead);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000');
  const unsubscribeUrl = lead.id ? `${baseUrl}/api/unsubscribe?id=${lead.id}` : '#';

  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
      ${personalizedBody}
      <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
        <tr>
          <td style="font-size: 12px; color: #999; line-height: 1.6;">
            Blok Blok Studio &mdash; Digital Agency for Ambitious Brands
            <br/>You received this because you requested a free audit.
            <br/><a href="${unsubscribeUrl}" style="color: #999; text-decoration: underline;">Unsubscribe from future emails</a>
          </td>
        </tr>
      </table>
    </div>
  `;
}

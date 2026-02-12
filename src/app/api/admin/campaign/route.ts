import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';
import { sendCampaignEmail } from '@/lib/email';

// POST /api/admin/campaign — send an email campaign to all active leads
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { subject, body } = await req.json();

  if (!subject || !body) {
    return NextResponse.json(
      { error: 'Missing subject or body' },
      { status: 400 }
    );
  }

  // Get all leads who haven't unsubscribed
  const leads = await prisma.lead.findMany({
    where: { unsubscribed: false },
    select: { id: true, email: true, name: true },
  });

  if (leads.length === 0) {
    return NextResponse.json(
      { error: 'No active leads to send to' },
      { status: 400 }
    );
  }

  // Create campaign record
  const campaign = await prisma.emailCampaign.create({
    data: {
      subject,
      body,
      status: 'sending',
    },
  });

  // Send emails (in sequence to respect rate limits)
  let sentCount = 0;
  for (const lead of leads) {
    // Personalize: replace {{name}} in body
    const personalizedBody = body.replace(/\{\{name\}\}/g, lead.name);

    // Add unsubscribe footer
    const html = `
      ${personalizedBody}
      <hr style="margin-top: 32px; border: none; border-top: 1px solid #eee;" />
      <p style="font-size: 12px; color: #999; margin-top: 16px;">
        You received this because you requested a free audit from Blok Blok Studio.
        <br/>To unsubscribe, reply with "unsubscribe" or contact us directly.
      </p>
    `;

    const ok = await sendCampaignEmail({ to: lead.email, subject, html });
    if (ok) {
      sentCount++;
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          emailsSent: { increment: 1 },
          lastEmailAt: new Date(),
        },
      });
    }
  }

  // Update campaign
  await prisma.emailCampaign.update({
    where: { id: campaign.id },
    data: {
      sentTo: sentCount,
      sentAt: new Date(),
      status: 'sent',
    },
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

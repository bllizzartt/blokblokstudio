import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendCampaignEmail } from '@/lib/email';
import { buildEmailHtml } from '@/app/api/admin/campaign/route';

/**
 * Cron job endpoint — processes queued and scheduled campaigns.
 * Called by Vercel Cron every 5 minutes.
 * Protected by CRON_SECRET to prevent unauthorized access.
 */
export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel sets this automatically for cron jobs)
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  // Find campaigns that need processing
  const campaigns = await prisma.emailCampaign.findMany({
    where: {
      OR: [
        { status: 'queued' },
        {
          status: 'scheduled',
          scheduledAt: { lte: now },
        },
      ],
    },
    orderBy: { createdAt: 'asc' },
    take: 3, // Process up to 3 campaigns per run to stay within time limits
  });

  if (campaigns.length === 0) {
    return NextResponse.json({ message: 'No campaigns to process', processed: 0 });
  }

  const results = [];

  for (const campaign of campaigns) {
    // Mark as sending
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'sending' },
    });

    // Get target leads
    const leadIdList = campaign.leadIds ? JSON.parse(campaign.leadIds) as string[] : null;
    const where = leadIdList && leadIdList.length > 0
      ? { id: { in: leadIdList }, unsubscribed: false }
      : { unsubscribed: false };

    const leads = await prisma.lead.findMany({
      where,
      select: { id: true, email: true, name: true, field: true, website: true, problem: true },
    });

    let sentCount = 0;

    for (const lead of leads) {
      const html = buildEmailHtml(campaign.body, lead);
      const personalizedSubject = campaign.subject
        .replace(/\{\{name\}\}/g, lead.name)
        .replace(/\{\{email\}\}/g, lead.email)
        .replace(/\{\{field\}\}/g, lead.field)
        .replace(/\{\{website\}\}/g, lead.website || 'N/A')
        .replace(/\{\{problem\}\}/g, lead.problem);

      const ok = await sendCampaignEmail({
        to: lead.email,
        subject: personalizedSubject,
        html,
        leadId: lead.id,
      });

      if (ok) {
        sentCount++;
        await prisma.lead.update({
          where: { id: lead.id },
          data: { emailsSent: { increment: 1 }, lastEmailAt: new Date() },
        });
      }

      // Rate limit: 200ms delay between emails to avoid being flagged
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    // Update campaign record
    await prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: {
        sentTo: sentCount,
        sentAt: new Date(),
        status: sentCount > 0 ? 'sent' : 'failed',
      },
    });

    results.push({
      campaignId: campaign.id,
      subject: campaign.subject,
      sentTo: sentCount,
      total: leads.length,
    });
  }

  return NextResponse.json({
    message: `Processed ${campaigns.length} campaign(s)`,
    processed: campaigns.length,
    results,
  });
}

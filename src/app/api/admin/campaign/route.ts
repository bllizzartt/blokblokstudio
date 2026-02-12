import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';
import { sendCampaignEmail } from '@/lib/email';

// POST /api/admin/campaign — send an email campaign
// Supports: all active leads, selected leads by ID, or a single lead
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { subject, body, leadIds } = await req.json();

  if (!subject || !body) {
    return NextResponse.json(
      { error: 'Missing subject or body' },
      { status: 400 }
    );
  }

  // Get leads — either specific ones or all active
  const where = leadIds && leadIds.length > 0
    ? { id: { in: leadIds }, unsubscribed: false }
    : { unsubscribed: false };

  const leads = await prisma.lead.findMany({
    where,
    select: { id: true, email: true, name: true, field: true, website: true, problem: true },
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
    // Personalize all merge tags
    const personalizedBody = body
      .replace(/\{\{name\}\}/g, lead.name)
      .replace(/\{\{email\}\}/g, lead.email)
      .replace(/\{\{field\}\}/g, lead.field)
      .replace(/\{\{website\}\}/g, lead.website || 'N/A')
      .replace(/\{\{problem\}\}/g, lead.problem);

    // Add branded footer
    const html = `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto;">
        ${personalizedBody}
        <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;" />
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top: 20px;">
          <tr>
            <td style="font-size: 12px; color: #999; line-height: 1.6;">
              Blok Blok Studio &mdash; Digital Agency for Ambitious Brands
              <br/>You received this because you requested a free audit.
              <br/>To unsubscribe, reply with &ldquo;unsubscribe&rdquo;.
            </td>
          </tr>
        </table>
      </div>
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

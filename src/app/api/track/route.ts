import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// 1x1 transparent PNG pixel
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

/**
 * GET /api/track?t=open&lid=LEAD_ID&cid=CAMPAIGN_ID
 * Open tracking — returns a 1x1 pixel and logs the open event.
 *
 * GET /api/track?t=click&lid=LEAD_ID&cid=CAMPAIGN_ID&url=ENCODED_URL
 * Click tracking — logs the click and redirects to the actual URL.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const type = url.searchParams.get('t');
  const leadId = url.searchParams.get('lid');
  const campaignId = url.searchParams.get('cid');
  const redirectUrl = url.searchParams.get('url');

  // Validate required params
  if (!type || !leadId) {
    if (type === 'open') {
      // Still return pixel even if params are missing
      return new NextResponse(PIXEL, {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      });
    }
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  // Sanitize leadId to prevent injection
  const cleanLeadId = leadId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  const cleanCampaignId = campaignId?.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50) || null;

  if (type === 'open') {
    // Log open event (non-blocking — don't slow down pixel response)
    logEvent(cleanLeadId, 'opened', cleanCampaignId).catch(() => {});

    return new NextResponse(PIXEL, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache',
      },
    });
  }

  if (type === 'click') {
    if (!redirectUrl) {
      return NextResponse.json({ error: 'Missing redirect URL' }, { status: 400 });
    }

    // Validate redirect URL to prevent open redirect attacks
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(redirectUrl);
      // Only allow http/https redirects
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 });
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 });
    }

    // Log click event (non-blocking)
    logEvent(cleanLeadId, 'clicked', cleanCampaignId, parsedUrl.href).catch(() => {});

    // 302 redirect to the actual URL
    return NextResponse.redirect(parsedUrl.href, 302);
  }

  return NextResponse.json({ error: 'Unknown tracking type' }, { status: 400 });
}

async function logEvent(leadId: string, type: string, campaignId: string | null, details?: string) {
  try {
    // Check if this exact event was already logged recently (dedup within 1 hour)
    const oneHourAgo = new Date(Date.now() - 3600000);
    const existing = await prisma.emailEvent.findFirst({
      where: {
        leadId,
        type,
        campaignId: campaignId || undefined,
        createdAt: { gte: oneHourAgo },
      },
    });

    if (existing) return; // Already logged

    await prisma.emailEvent.create({
      data: { leadId, type, campaignId, details },
    });
  } catch {
    // Silently fail — don't break tracking
  }
}

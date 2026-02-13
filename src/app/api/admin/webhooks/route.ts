import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';

// GET - list configured webhook URLs
// POST - fire a test webhook
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const urls = (process.env.WEBHOOK_URLS || '').split(',').filter(Boolean);
  return NextResponse.json({ webhooks: urls });
}

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { url, event, data } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    // Validate URL
    try { new URL(url); } catch { return NextResponse.json({ error: 'Invalid URL' }, { status: 400 }); }
    // Only allow https
    if (!url.startsWith('https://')) {
      return NextResponse.json({ error: 'Only HTTPS URLs allowed' }, { status: 400 });
    }

    const payload = {
      event: event || 'test',
      timestamp: new Date().toISOString(),
      data: data || { message: 'Test webhook from Blok Blok Admin' },
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000),
    });

    return NextResponse.json({
      success: res.ok,
      status: res.status,
      statusText: res.statusText,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Webhook failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

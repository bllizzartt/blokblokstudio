import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/unsubscribe?id=xxx — one-click unsubscribe for email compliance.
 * Shows a simple confirmation page and marks the lead as unsubscribed.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return new NextResponse(htmlPage('Invalid Link', 'This unsubscribe link is not valid.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  try {
    await prisma.lead.update({
      where: { id },
      data: { unsubscribed: true },
    });

    return new NextResponse(
      htmlPage(
        'Unsubscribed',
        'You have been successfully unsubscribed from Blok Blok Studio emails. You will no longer receive marketing emails from us.'
      ),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  } catch {
    return new NextResponse(
      htmlPage('Already Unsubscribed', 'You are already unsubscribed or this link has expired.'),
      { status: 200, headers: { 'Content-Type': 'text/html' } }
    );
  }
}

/**
 * POST /api/unsubscribe — one-click unsubscribe via List-Unsubscribe-Post header.
 * Email clients like Gmail use this for the "Unsubscribe" button in the UI.
 */
export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    await prisma.lead.update({
      where: { id },
      data: { unsubscribed: true },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // Don't leak info
  }
}

function htmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — Blok Blok Studio</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; }
    .card { max-width: 480px; text-align: center; }
    h1 { font-size: 24px; margin-bottom: 12px; color: #f97316; }
    p { color: #999; line-height: 1.6; font-size: 15px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`;
}

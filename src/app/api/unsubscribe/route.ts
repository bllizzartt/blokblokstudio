import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/unsubscribe?id=xxx — branded unsubscribe page with options.
 * Offers: reduce frequency, change preferences, or full unsubscribe.
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  const action = req.nextUrl.searchParams.get('action');

  if (!id) {
    return new NextResponse(htmlPage('Invalid Link', 'invalid', null), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Handle action from the form
  if (action === 'unsubscribe') {
    try {
      await prisma.lead.update({
        where: { id },
        data: { unsubscribed: true, status: 'unsubscribed' },
      });
      // Log event
      try {
        await prisma.emailEvent.create({
          data: { leadId: id, type: 'unsubscribed', details: 'Manual unsubscribe via page' },
        });
      } catch { /* ignore */ }
    } catch { /* already unsubscribed or not found */ }

    return new NextResponse(htmlPage('Unsubscribed', 'unsubscribed', null), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (action === 'reduce') {
    // Mark lead with a tag to reduce frequency
    try {
      const lead = await prisma.lead.findUnique({ where: { id }, select: { tags: true } });
      const tags: string[] = lead?.tags ? (() => { try { return JSON.parse(lead.tags); } catch { return []; } })() : [];
      if (!tags.includes('low-frequency')) tags.push('low-frequency');
      await prisma.lead.update({
        where: { id },
        data: { tags: JSON.stringify(tags) },
      });
    } catch { /* ignore */ }

    return new NextResponse(htmlPage('Preferences Updated', 'reduced', null), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Feedback submission
  if (action === 'feedback') {
    const reason = req.nextUrl.searchParams.get('reason') || 'No reason given';
    try {
      await prisma.lead.update({
        where: { id },
        data: { unsubscribed: true, status: 'unsubscribed' },
      });
      await prisma.emailEvent.create({
        data: { leadId: id, type: 'unsubscribed', details: `Reason: ${reason.slice(0, 200)}` },
      });
    } catch { /* ignore */ }

    return new NextResponse(htmlPage('Thank You', 'feedback', null), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  // Default: show the unsubscribe options page
  try {
    const lead = await prisma.lead.findUnique({ where: { id }, select: { name: true, email: true } });
    return new NextResponse(htmlPage('Email Preferences', 'options', lead ? { id, name: lead.name, email: lead.email } : { id, name: '', email: '' }), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  } catch {
    return new NextResponse(htmlPage('Email Preferences', 'options', { id, name: '', email: '' }), {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    });
  }
}

/**
 * POST /api/unsubscribe — one-click unsubscribe via List-Unsubscribe-Post header.
 */
export async function POST(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    await prisma.lead.update({
      where: { id },
      data: { unsubscribed: true, status: 'unsubscribed' },
    });
    await prisma.emailEvent.create({
      data: { leadId: id, type: 'unsubscribed', details: 'One-click unsubscribe header' },
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: true }); // Don't leak info
  }
}

function htmlPage(title: string, state: string, lead: { id: string; name: string; email: string } | null): string {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';

  let content = '';

  if (state === 'invalid') {
    content = `
      <div class="icon">&#10060;</div>
      <h1>Invalid Link</h1>
      <p>This unsubscribe link is not valid or has expired.</p>
    `;
  } else if (state === 'unsubscribed') {
    content = `
      <div class="icon">&#9989;</div>
      <h1>You&rsquo;ve Been Unsubscribed</h1>
      <p>You will no longer receive emails from us. We&rsquo;re sorry to see you go.</p>
      <p class="small">If this was a mistake, just reply to any of our previous emails and we&rsquo;ll re-subscribe you.</p>
    `;
  } else if (state === 'reduced') {
    content = `
      <div class="icon">&#128230;</div>
      <h1>Email Frequency Reduced</h1>
      <p>We&rsquo;ve updated your preferences. You&rsquo;ll hear from us less often.</p>
    `;
  } else if (state === 'feedback') {
    content = `
      <div class="icon">&#128591;</div>
      <h1>Thank You for Your Feedback</h1>
      <p>You&rsquo;ve been unsubscribed. Your feedback helps us improve.</p>
    `;
  } else if (state === 'options' && lead) {
    content = `
      <h1>Email Preferences</h1>
      ${lead.email ? `<p class="email-badge">${lead.email}</p>` : ''}
      <p>How would you like to manage your email preferences?</p>

      <div class="options">
        <a href="${baseUrl}/api/unsubscribe?id=${lead.id}&action=reduce" class="option option-reduce">
          <div class="option-icon">&#128229;</div>
          <div>
            <strong>Reduce Frequency</strong>
            <span>Get fewer emails from us</span>
          </div>
        </a>

        <a href="${baseUrl}/api/unsubscribe?id=${lead.id}&action=unsubscribe" class="option option-unsub">
          <div class="option-icon">&#128683;</div>
          <div>
            <strong>Unsubscribe Completely</strong>
            <span>Stop all emails</span>
          </div>
        </a>
      </div>

      <div class="feedback-section">
        <p class="small">Help us improve — why are you leaving?</p>
        <div class="reasons">
          ${['Too many emails', 'Not relevant to me', 'Never signed up', 'Content not useful', 'Other'].map(reason =>
            `<a href="${baseUrl}/api/unsubscribe?id=${lead.id}&action=feedback&reason=${encodeURIComponent(reason)}" class="reason-btn">${reason}</a>`
          ).join('\n          ')}
        </div>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title} — Blok Blok Studio</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
    .card { max-width: 520px; width: 100%; text-align: center; }
    .logo { font-size: 14px; font-weight: 900; color: #f97316; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 32px; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    h1 { font-size: 24px; margin-bottom: 12px; }
    p { color: #999; line-height: 1.6; font-size: 15px; margin-bottom: 12px; }
    .small { font-size: 13px; color: #666; }
    .email-badge { display: inline-block; background: rgba(249,115,22,0.1); color: #f97316; padding: 4px 16px; border-radius: 20px; font-size: 13px; margin-bottom: 20px; }
    .options { display: flex; flex-direction: column; gap: 12px; margin: 24px 0; }
    .option { display: flex; align-items: center; gap: 16px; padding: 16px 20px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.06); text-decoration: none; color: #fff; transition: all 0.2s; text-align: left; }
    .option:hover { border-color: rgba(255,255,255,0.12); background: rgba(255,255,255,0.02); }
    .option-icon { font-size: 28px; flex-shrink: 0; }
    .option strong { display: block; font-size: 15px; margin-bottom: 2px; }
    .option span { font-size: 13px; color: #888; }
    .option-unsub:hover { border-color: rgba(239,68,68,0.3); }
    .feedback-section { margin-top: 32px; padding-top: 24px; border-top: 1px solid rgba(255,255,255,0.06); }
    .reasons { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 12px; }
    .reason-btn { padding: 6px 14px; border-radius: 20px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.06); color: #999; font-size: 12px; text-decoration: none; transition: all 0.2s; }
    .reason-btn:hover { color: #fff; border-color: rgba(249,115,22,0.3); background: rgba(249,115,22,0.05); }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">Blok Blok Studio</div>
    ${content}
  </div>
</body>
</html>`;
}

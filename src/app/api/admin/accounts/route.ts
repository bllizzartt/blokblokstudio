import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';
import { getWarmupStats, WARMUP_PHASES } from '@/lib/smtp';
import { encrypt } from '@/lib/crypto';

// GET /api/admin/accounts — list all sending accounts with warmup stats
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const stats = await getWarmupStats();
  return NextResponse.json({ accounts: stats, phases: WARMUP_PHASES });
}

// POST /api/admin/accounts — add a new sending account with SMTP + optional IMAP
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const {
      email, smtpHost, smtpPort, smtpUser, smtpPass, label,
      imapHost, imapPort, imapUser, imapPass,
      sendWindowStart, sendWindowEnd, sendWeekdays,
    } = await req.json();

    if (!email || !smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Missing required SMTP fields' }, { status: 400 });
    }

    // Validate email format
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {
      label: label || email,
      email: email.trim().toLowerCase(),
      smtpHost: smtpHost.trim(),
      smtpPort: smtpPort || 587,
      smtpUser: smtpUser.trim(),
      smtpPass: encrypt(smtpPass), // Encrypted at rest
      dailyLimit: WARMUP_PHASES[1].dailyLimit,
      warmupPhase: 1,
    };

    // Optional IMAP settings for reply tracking
    if (imapHost && imapUser && imapPass) {
      data.imapHost = imapHost.trim();
      data.imapPort = imapPort || 993;
      data.imapUser = imapUser.trim();
      data.imapPass = encrypt(imapPass); // Encrypted at rest
    }

    // Optional send window
    if (typeof sendWindowStart === 'number') data.sendWindowStart = sendWindowStart;
    if (typeof sendWindowEnd === 'number') data.sendWindowEnd = sendWindowEnd;
    if (sendWeekdays) data.sendWeekdays = sendWeekdays;

    const account = await prisma.sendingAccount.create({ data });

    return NextResponse.json({ success: true, account: { id: account.id, email: account.email } });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Add account error:', errMsg);
    const msg = errMsg.includes('Unique')
      ? 'This email is already added'
      : `Failed to add account: ${errMsg.slice(0, 200)}`;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// DELETE /api/admin/accounts?id=xxx — remove a sending account
export async function DELETE(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await prisma.sendingAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  }
}

// PATCH /api/admin/accounts — update account settings
export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const {
      id, active, dailyLimit, warmupPhase,
      imapHost, imapPort, imapUser, imapPass,
      smtpPass,
      sendWindowStart, sendWindowEnd, sendWeekdays,
    } = await req.json();

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = {};
    if (typeof active === 'boolean') data.active = active;
    if (typeof dailyLimit === 'number') data.dailyLimit = dailyLimit;
    if (typeof warmupPhase === 'number') data.warmupPhase = warmupPhase;

    // IMAP settings
    if (imapHost !== undefined) data.imapHost = imapHost || null;
    if (imapPort !== undefined) data.imapPort = imapPort || 993;
    if (imapUser !== undefined) data.imapUser = imapUser || null;
    if (imapPass !== undefined) data.imapPass = imapPass ? encrypt(imapPass) : null;

    // SMTP password update
    if (smtpPass) data.smtpPass = encrypt(smtpPass);

    // Send window
    if (typeof sendWindowStart === 'number') data.sendWindowStart = sendWindowStart;
    if (typeof sendWindowEnd === 'number') data.sendWindowEnd = sendWindowEnd;
    if (sendWeekdays !== undefined) data.sendWeekdays = sendWeekdays;

    await prisma.sendingAccount.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update account' }, { status: 400 });
  }
}

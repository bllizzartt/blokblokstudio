import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';
import { getWarmupStats, WARMUP_PHASES } from '@/lib/smtp';

// GET /api/admin/accounts — list all sending accounts with warmup stats
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const stats = await getWarmupStats();
  return NextResponse.json({ accounts: stats, phases: WARMUP_PHASES });
}

// POST /api/admin/accounts — add a new sending account
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { email, smtpHost, smtpPort, smtpUser, smtpPass, label } = await req.json();

    if (!email || !smtpHost || !smtpUser || !smtpPass) {
      return NextResponse.json({ error: 'Missing required SMTP fields' }, { status: 400 });
    }

    const account = await prisma.sendingAccount.create({
      data: {
        label: label || email,
        email,
        smtpHost,
        smtpPort: smtpPort || 587,
        smtpUser,
        smtpPass,
        dailyLimit: WARMUP_PHASES[1].dailyLimit,
        warmupPhase: 1,
      },
    });

    return NextResponse.json({ success: true, account: { id: account.id, email: account.email } });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('Add account error:', errMsg);
    const msg = errMsg.includes('Unique')
      ? 'This email is already added'
      : errMsg.includes('does not exist') || errMsg.includes('relation') || errMsg.includes('table')
      ? 'Database table not found — run "npx prisma db push" to create it'
      : `Failed to add account: ${errMsg.slice(0, 120)}`;
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

// PATCH /api/admin/accounts — update account (toggle active, change limits)
export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { id, active, dailyLimit, warmupPhase } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (typeof active === 'boolean') data.active = active;
    if (typeof dailyLimit === 'number') data.dailyLimit = dailyLimit;
    if (typeof warmupPhase === 'number') data.warmupPhase = warmupPhase;

    await prisma.sendingAccount.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update account' }, { status: 400 });
  }
}

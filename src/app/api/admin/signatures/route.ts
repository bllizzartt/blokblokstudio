import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// Signatures are stored in SendingAccount as a JSON field.
// Since the column doesn't exist yet, we'll use $queryRawUnsafe to add it.

// GET /api/admin/signatures — get all account signatures
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    // Try to get signatures; column might not exist yet
    const accounts = await prisma.$queryRawUnsafe<{ id: string; email: string; label: string; signature: string | null }[]>(
      `SELECT "id", "email", "label", COALESCE("signature", '') as "signature" FROM "SendingAccount" WHERE "active" = true ORDER BY "email"`
    );
    return NextResponse.json({ accounts });
  } catch {
    // Column doesn't exist — return without signatures
    const accounts = await prisma.sendingAccount.findMany({
      where: { active: true },
      select: { id: true, email: true, label: true },
    });
    return NextResponse.json({ accounts: accounts.map(a => ({ ...a, signature: '' })) });
  }
}

// PATCH /api/admin/signatures — update signature for an account
export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { accountId, signature } = await req.json();
    if (!accountId) return NextResponse.json({ error: 'Missing accountId' }, { status: 400 });

    // Ensure column exists
    try {
      await prisma.$executeRawUnsafe(`ALTER TABLE "SendingAccount" ADD COLUMN IF NOT EXISTS "signature" TEXT DEFAULT ''`);
    } catch { /* column might already exist */ }

    await prisma.$executeRawUnsafe(
      `UPDATE "SendingAccount" SET "signature" = $1 WHERE "id" = $2`,
      signature || '',
      accountId
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg.slice(0, 200) }, { status: 500 });
  }
}

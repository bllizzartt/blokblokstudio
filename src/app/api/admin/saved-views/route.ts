import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * Saved Views API — save and load filter presets for the leads table.
 *
 * GET — list all saved views
 * POST — create a new saved view
 * DELETE — delete a saved view
 */

async function ensureTable() {
  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "SavedView" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL,
        "filters" TEXT NOT NULL DEFAULT '{}',
        "color" TEXT DEFAULT '#f97316',
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`
    );
  } catch { /* already exists */ }
}

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  await ensureTable();

  try {
    const views = await prisma.$queryRawUnsafe<Array<{
      id: string; name: string; filters: string; color: string; createdAt: Date;
    }>>(
      `SELECT * FROM "SavedView" ORDER BY "createdAt" DESC`
    );

    return NextResponse.json({
      views: views.map(v => ({
        ...v,
        filters: JSON.parse(v.filters),
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { name, filters, color } = await req.json();
  if (!name || !filters) {
    return NextResponse.json({ error: 'Name and filters required' }, { status: 400 });
  }

  await ensureTable();

  try {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "SavedView" ("name", "filters", "color") VALUES ($1, $2, $3)`,
      name,
      JSON.stringify(filters),
      color || '#f97316',
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'View id required' }, { status: 400 });
  }

  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "SavedView" WHERE "id" = $1`,
      id,
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, { status: 500 });
  }
}

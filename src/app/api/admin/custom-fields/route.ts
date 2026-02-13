import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/custom-fields — Get custom field definitions
 * POST /api/admin/custom-fields — Create a custom field definition
 * PATCH /api/admin/custom-fields — Update a lead's custom field value
 * DELETE /api/admin/custom-fields — Delete a custom field definition
 *
 * Custom fields are stored as JSON in the lead's `customFields` column.
 * Field definitions are stored in a simple metadata table.
 */

// Ensure the customFields column exists on Lead
async function ensureCustomFieldsColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "customFields" TEXT DEFAULT '{}'`
    );
  } catch { /* already exists */ }
}

// Field definitions stored in a lightweight JSON approach using a settings-like pattern
async function getFieldDefinitions(): Promise<Array<{ name: string; type: string; options?: string[] }>> {
  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "CustomFieldDef" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL UNIQUE,
        "type" TEXT NOT NULL DEFAULT 'text',
        "options" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`
    );
    const rows = await prisma.$queryRawUnsafe<Array<{ name: string; type: string; options: string | null }>>(
      `SELECT "name", "type", "options" FROM "CustomFieldDef" ORDER BY "createdAt" ASC`
    );
    return rows.map(r => ({
      name: r.name,
      type: r.type,
      options: r.options ? JSON.parse(r.options) : undefined,
    }));
  } catch {
    return [];
  }
}

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  await ensureCustomFieldsColumn();
  const fields = await getFieldDefinitions();

  return NextResponse.json({ fields });
}

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { name, type, options } = await req.json();
  if (!name || !type) {
    return NextResponse.json({ error: 'Name and type required' }, { status: 400 });
  }

  const validTypes = ['text', 'number', 'date', 'select', 'url', 'email', 'boolean'];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `Invalid type. Use: ${validTypes.join(', ')}` }, { status: 400 });
  }

  await ensureCustomFieldsColumn();

  try {
    await prisma.$executeRawUnsafe(
      `CREATE TABLE IF NOT EXISTS "CustomFieldDef" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
        "name" TEXT NOT NULL UNIQUE,
        "type" TEXT NOT NULL DEFAULT 'text',
        "options" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )`
    );
    await prisma.$executeRawUnsafe(
      `INSERT INTO "CustomFieldDef" ("name", "type", "options") VALUES ($1, $2, $3)`,
      name,
      type,
      options ? JSON.stringify(options) : null,
    );

    return NextResponse.json({ success: true, field: { name, type, options } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('unique') || msg.includes('duplicate')) {
      return NextResponse.json({ error: 'Field name already exists' }, { status: 409 });
    }
    return NextResponse.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { leadId, fieldName, value } = await req.json();
  if (!leadId || !fieldName) {
    return NextResponse.json({ error: 'leadId and fieldName required' }, { status: 400 });
  }

  await ensureCustomFieldsColumn();

  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ customFields: string | null }>>(
      `SELECT "customFields" FROM "Lead" WHERE "id" = $1`,
      leadId,
    );
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const existing = rows[0].customFields ? JSON.parse(rows[0].customFields) : {};
    existing[fieldName] = value;

    await prisma.$executeRawUnsafe(
      `UPDATE "Lead" SET "customFields" = $1 WHERE "id" = $2`,
      JSON.stringify(existing),
      leadId,
    );

    return NextResponse.json({ success: true, customFields: existing });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { name } = await req.json();
  if (!name) {
    return NextResponse.json({ error: 'Field name required' }, { status: 400 });
  }

  try {
    await prisma.$executeRawUnsafe(
      `DELETE FROM "CustomFieldDef" WHERE "name" = $1`,
      name,
    );
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, { status: 500 });
  }
}

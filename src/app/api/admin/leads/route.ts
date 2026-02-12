import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/leads — list all leads
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ leads, total: leads.length });
}

// DELETE /api/admin/leads?id=xxx — delete a lead
export async function DELETE(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Missing lead id' }, { status: 400 });
  }

  try {
    await prisma.lead.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Lead not found or already deleted' }, { status: 404 });
  }
}

// POST /api/admin/leads/import — import leads from CSV data
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { leads: importData } = await req.json();

    if (!Array.isArray(importData) || importData.length === 0) {
      return NextResponse.json({ error: 'No valid leads to import' }, { status: 400 });
    }

    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const row of importData) {
      const { name, email, field, website, problem } = row;

      if (!name || !email || !field || !problem) {
        skipped++;
        errors.push(`Skipped: missing fields for ${email || 'unknown'}`);
        continue;
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        skipped++;
        errors.push(`Skipped: invalid email ${email}`);
        continue;
      }

      try {
        await prisma.lead.upsert({
          where: { email },
          update: { name, field, website: website || null, problem },
          create: {
            name,
            email,
            field,
            website: website || null,
            problem,
            source: 'csv-import',
          },
        });
        imported++;
      } catch {
        skipped++;
        errors.push(`Failed to import ${email}`);
      }
    }

    return NextResponse.json({
      success: true,
      imported,
      skipped,
      total: importData.length,
      errors: errors.slice(0, 10),
    });
  } catch {
    return NextResponse.json({ error: 'Invalid import data' }, { status: 400 });
  }
}

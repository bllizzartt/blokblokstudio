import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/leads — list all leads
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json({ leads, total: leads.length });
  } catch (err) {
    // If new schema columns are missing (setup-db not yet run), fall back to basic columns
    const errMsg = err instanceof Error ? err.message : String(err);
    if (errMsg.includes('column') || errMsg.includes('does not exist')) {
      try {
        const leads = await prisma.lead.findMany({
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, email: true, field: true, website: true,
            noWebsite: true, problem: true, emailsSent: true, lastEmailAt: true,
            unsubscribed: true, createdAt: true, source: true,
          },
        });
        const enriched = leads.map(l => ({
          ...l, status: 'new', tags: null, emailVerified: false,
          verifyResult: null, verifiedAt: null, bounceCount: 0, bounceType: null,
          updatedAt: l.createdAt,
        }));
        return NextResponse.json({
          leads: enriched, total: enriched.length,
          warning: 'Some columns missing — run setup-db to enable new features',
        });
      } catch {
        // Even basic query failed
      }
    }
    return NextResponse.json(
      { error: `Failed to fetch leads: ${errMsg.slice(0, 200)}` },
      { status: 500 }
    );
  }
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

// PATCH /api/admin/leads — update lead status, tags
export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { id, ids, status, tags, action } = await req.json();

    // Bulk status update
    if (ids && Array.isArray(ids) && status) {
      await prisma.lead.updateMany({
        where: { id: { in: ids } },
        data: { status },
      });
      return NextResponse.json({ success: true, updated: ids.length });
    }

    // Single lead update
    if (id) {
      const data: Record<string, unknown> = {};
      if (status) data.status = status;
      if (tags !== undefined) data.tags = typeof tags === 'string' ? tags : JSON.stringify(tags);
      if (action === 'addTag' && tags) {
        const lead = await prisma.lead.findUnique({ where: { id }, select: { tags: true } });
        const existing: string[] = lead?.tags ? JSON.parse(lead.tags) : [];
        if (!existing.includes(tags)) {
          existing.push(tags);
          data.tags = JSON.stringify(existing);
        }
      }
      if (action === 'removeTag' && tags) {
        const lead = await prisma.lead.findUnique({ where: { id }, select: { tags: true } });
        const existing: string[] = lead?.tags ? JSON.parse(lead.tags) : [];
        data.tags = JSON.stringify(existing.filter(t => t !== tags));
      }

      await prisma.lead.update({ where: { id }, data });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Missing id or ids' }, { status: 400 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Update failed: ${errMsg.slice(0, 200)}` }, { status: 400 });
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

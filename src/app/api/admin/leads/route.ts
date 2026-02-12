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

  await prisma.lead.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

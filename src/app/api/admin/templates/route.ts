import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/templates — list all templates
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const templates = await prisma.emailTemplate.findMany({
    orderBy: { updatedAt: 'desc' },
  });
  return NextResponse.json({ templates });
}

// POST /api/admin/templates — create or update a template
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { id, name, subject, body } = await req.json();

    if (!name || !subject || !body) {
      return NextResponse.json({ error: 'Name, subject, and body are required' }, { status: 400 });
    }

    if (id) {
      // Update existing
      const template = await prisma.emailTemplate.update({
        where: { id },
        data: { name, subject, body },
      });
      return NextResponse.json({ success: true, template });
    } else {
      // Create new
      const template = await prisma.emailTemplate.create({
        data: { name, subject, body },
      });
      return NextResponse.json({ success: true, template });
    }
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to save template: ${errMsg.slice(0, 200)}` }, { status: 400 });
  }
}

// DELETE /api/admin/templates?id=xxx — delete a template
export async function DELETE(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await prisma.emailTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Template not found' }, { status: 404 });
  }
}

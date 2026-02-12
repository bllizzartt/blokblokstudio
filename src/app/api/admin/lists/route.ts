import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/lists — all lists with member counts and sequence stats
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const lists = await prisma.leadList.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        members: {
          select: { leadId: true },
        },
      },
    });

    // For each list, get lead details and sequence enrollment stats
    const enriched = await Promise.all(
      lists.map(async (list) => {
        const leadIds = list.members.map((m) => m.leadId);

        // Get sequence enrollment stats for leads in this list
        let sequenceStats = { total: leadIds.length, notStarted: 0, inProgress: 0, completed: 0, replied: 0 };
        if (leadIds.length > 0) {
          const [enrollments, repliedLeads] = await Promise.all([
            prisma.sequenceEnrollment.findMany({
              where: { leadId: { in: leadIds } },
              select: { leadId: true, status: true, currentStep: true },
            }),
            prisma.lead.count({
              where: { id: { in: leadIds }, status: { in: ['replied', 'interested', 'booked'] } },
            }),
          ]);

          const enrolledLeadIds = new Set(enrollments.map((e) => e.leadId));
          sequenceStats.notStarted = leadIds.filter((id) => !enrolledLeadIds.has(id)).length;
          sequenceStats.inProgress = enrollments.filter((e) => e.status === 'active').length;
          sequenceStats.completed = enrollments.filter((e) => e.status === 'completed').length;
          sequenceStats.replied = repliedLeads;
        }

        return {
          id: list.id,
          name: list.name,
          description: list.description,
          color: list.color,
          memberCount: leadIds.length,
          sequenceStats,
          createdAt: list.createdAt,
          updatedAt: list.updatedAt,
        };
      })
    );

    return NextResponse.json({ lists: enriched });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to fetch lists: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

// POST /api/admin/lists — create list, add leads to list, remove leads from list
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { action, name, description, color, listId, leadIds } = await req.json();

    // Create a new list
    if (action === 'create' || (!action && name)) {
      if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
      const list = await prisma.leadList.create({
        data: { name, description: description || null, color: color || '#f97316' },
      });
      return NextResponse.json({ success: true, list });
    }

    // Add leads to a list
    if (action === 'addLeads') {
      if (!listId || !leadIds?.length) return NextResponse.json({ error: 'Missing listId or leadIds' }, { status: 400 });

      let added = 0;
      for (const leadId of leadIds) {
        try {
          await prisma.leadListMember.create({ data: { listId, leadId } });
          added++;
        } catch {
          // Duplicate — skip
        }
      }
      return NextResponse.json({ success: true, added, total: leadIds.length });
    }

    // Remove leads from a list
    if (action === 'removeLeads') {
      if (!listId || !leadIds?.length) return NextResponse.json({ error: 'Missing listId or leadIds' }, { status: 400 });
      await prisma.leadListMember.deleteMany({
        where: { listId, leadId: { in: leadIds } },
      });
      return NextResponse.json({ success: true, removed: leadIds.length });
    }

    // Move leads between lists (remove from source, add to destination)
    if (action === 'moveLeads') {
      const { fromListId, toListId } = await req.json();
      if (!fromListId || !toListId || !leadIds?.length) {
        return NextResponse.json({ error: 'Missing fromListId, toListId, or leadIds' }, { status: 400 });
      }
      // Remove from source
      await prisma.leadListMember.deleteMany({
        where: { listId: fromListId, leadId: { in: leadIds } },
      });
      // Add to destination
      let moved = 0;
      for (const leadId of leadIds) {
        try {
          await prisma.leadListMember.create({ data: { listId: toListId, leadId } });
          moved++;
        } catch { /* duplicate, skip */ }
      }
      return NextResponse.json({ success: true, moved });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

// PATCH /api/admin/lists — update list name/description/color
export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { id, name, description, color } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing list id' }, { status: 400 });

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (color !== undefined) data.color = color;

    await prisma.leadList.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Update failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

// DELETE /api/admin/lists?id=xxx — delete a list (members removed via cascade)
export async function DELETE(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing list id' }, { status: 400 });

  try {
    await prisma.leadList.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'List not found' }, { status: 404 });
  }
}

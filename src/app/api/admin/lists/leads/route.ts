import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/lists/leads?listId=xxx — get all leads in a list with sequence progress
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const listId = req.nextUrl.searchParams.get('listId');
  if (!listId) return NextResponse.json({ error: 'Missing listId' }, { status: 400 });

  try {
    // Get lead IDs in this list
    const members = await prisma.leadListMember.findMany({
      where: { listId },
      select: { leadId: true, addedAt: true },
    });

    if (members.length === 0) {
      return NextResponse.json({ leads: [], enrollments: [] });
    }

    const leadIds = members.map((m) => m.leadId);

    // Get lead details and sequence enrollments in parallel
    const [leads, enrollments, sequences] = await Promise.all([
      prisma.lead.findMany({
        where: { id: { in: leadIds } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.sequenceEnrollment.findMany({
        where: { leadId: { in: leadIds } },
        include: {
          sequence: {
            select: {
              id: true,
              name: true,
              steps: { select: { id: true, order: true, subject: true }, orderBy: { order: 'asc' } },
            },
          },
        },
      }),
      prisma.sequence.findMany({
        select: { id: true, name: true, active: true, steps: { select: { id: true }, orderBy: { order: 'asc' } } },
      }),
    ]);

    // Build enriched leads with sequence progress
    const addedAtMap = Object.fromEntries(members.map((m) => [m.leadId, m.addedAt]));
    const enrollmentMap: Record<string, typeof enrollments> = {};
    for (const e of enrollments) {
      if (!enrollmentMap[e.leadId]) enrollmentMap[e.leadId] = [];
      enrollmentMap[e.leadId].push(e);
    }

    const enrichedLeads = leads.map((lead) => ({
      ...lead,
      addedToListAt: addedAtMap[lead.id],
      enrollments: (enrollmentMap[lead.id] || []).map((e) => ({
        id: e.id,
        sequenceId: e.sequenceId,
        sequenceName: e.sequence.name,
        currentStep: e.currentStep,
        totalSteps: e.sequence.steps.length,
        status: e.status,
        nextSendAt: e.nextSendAt,
        steps: e.sequence.steps,
      })),
    }));

    return NextResponse.json({
      leads: enrichedLeads,
      sequences: sequences.map((s) => ({ id: s.id, name: s.name, active: s.active, stepCount: s.steps.length })),
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

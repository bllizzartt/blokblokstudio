import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/sequences — list all sequences with steps and enrollment counts
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const sequences = await prisma.sequence.findMany({
    include: {
      steps: { orderBy: { order: 'asc' } },
      enrollments: {
        select: { status: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const result = sequences.map(seq => ({
    ...seq,
    enrolledCount: seq.enrollments.length,
    activeCount: seq.enrollments.filter(e => e.status === 'active').length,
    completedCount: seq.enrollments.filter(e => e.status === 'completed').length,
    enrollments: undefined,
  }));

  return NextResponse.json({ sequences: result });
}

// POST /api/admin/sequences — create a new sequence with steps
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { name, steps } = await req.json();

    if (!name || !Array.isArray(steps) || steps.length === 0) {
      return NextResponse.json({ error: 'Name and at least one step required' }, { status: 400 });
    }

    const sequence = await prisma.sequence.create({
      data: {
        name,
        steps: {
          create: steps.map((step: { subject: string; body: string; delayDays: number }, i: number) => ({
            order: i + 1,
            delayDays: step.delayDays || (i === 0 ? 0 : 2),
            subject: step.subject,
            body: step.body,
          })),
        },
      },
      include: { steps: true },
    });

    return NextResponse.json({ success: true, sequence });
  } catch (err) {
    console.error('[Sequences] Create error:', err);
    return NextResponse.json({ error: 'Failed to create sequence' }, { status: 400 });
  }
}

// DELETE /api/admin/sequences?id=xxx — delete a sequence
export async function DELETE(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await prisma.sequence.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });
  }
}

// PATCH /api/admin/sequences — enroll leads or toggle sequence
export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { id, action, leadIds, active } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Toggle active
    if (typeof active === 'boolean') {
      await prisma.sequence.update({ where: { id }, data: { active } });
      return NextResponse.json({ success: true });
    }

    // Enroll leads
    if (action === 'enroll' && Array.isArray(leadIds)) {
      const sequence = await prisma.sequence.findUnique({
        where: { id },
        include: { steps: { orderBy: { order: 'asc' }, take: 1 } },
      });
      if (!sequence) return NextResponse.json({ error: 'Sequence not found' }, { status: 404 });

      const firstStep = sequence.steps[0];
      const now = new Date();
      const nextSend = new Date(now.getTime() + (firstStep?.delayDays || 0) * 24 * 60 * 60 * 1000);

      let enrolled = 0;
      for (const leadId of leadIds) {
        try {
          await prisma.sequenceEnrollment.upsert({
            where: { sequenceId_leadId: { sequenceId: id, leadId } },
            update: { status: 'active', currentStep: 0, nextSendAt: nextSend },
            create: {
              sequenceId: id,
              leadId,
              currentStep: 0,
              nextSendAt: nextSend,
              status: 'active',
            },
          });
          enrolled++;
        } catch {
          // skip
        }
      }

      return NextResponse.json({ success: true, enrolled });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    console.error('[Sequences] Patch error:', err);
    return NextResponse.json({ error: 'Failed to update sequence' }, { status: 400 });
  }
}

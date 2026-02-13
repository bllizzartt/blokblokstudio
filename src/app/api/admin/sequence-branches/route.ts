import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * Conditional Sequence Branching API
 *
 * Allows sequences to branch based on lead behavior:
 * - If lead opened email → send follow-up A
 * - If lead didn't open → send follow-up B
 * - If lead clicked → skip to step N
 * - If lead replied → stop sequence
 *
 * Branches are stored as JSON in SequenceStep's `branches` column.
 */

interface Branch {
  condition: 'opened' | 'not_opened' | 'clicked' | 'not_clicked' | 'replied' | 'bounced';
  action: 'goto_step' | 'skip' | 'stop' | 'wait_extra';
  value?: number; // step number for goto, days for wait_extra
}

async function ensureBranchesColumn() {
  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "SequenceStep" ADD COLUMN IF NOT EXISTS "branches" TEXT DEFAULT '[]'`
    );
  } catch { /* already exists */ }
}

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const sequenceId = req.nextUrl.searchParams.get('sequenceId');
  if (!sequenceId) {
    return NextResponse.json({ error: 'sequenceId required' }, { status: 400 });
  }

  await ensureBranchesColumn();

  try {
    const steps = await prisma.$queryRawUnsafe<Array<{
      id: string; order: number; subject: string; delayDays: number; branches: string | null;
    }>>(
      `SELECT "id", "order", "subject", "delayDays", "branches"
       FROM "SequenceStep"
       WHERE "sequenceId" = $1
       ORDER BY "order" ASC`,
      sequenceId,
    );

    return NextResponse.json({
      steps: steps.map(s => ({
        ...s,
        branches: s.branches ? JSON.parse(s.branches) : [],
      })),
      conditions: ['opened', 'not_opened', 'clicked', 'not_clicked', 'replied', 'bounced'],
      actions: ['goto_step', 'skip', 'stop', 'wait_extra'],
    });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { stepId, branches } = await req.json() as { stepId: string; branches: Branch[] };
  if (!stepId || !Array.isArray(branches)) {
    return NextResponse.json({ error: 'stepId and branches array required' }, { status: 400 });
  }

  // Validate branches
  const validConditions = ['opened', 'not_opened', 'clicked', 'not_clicked', 'replied', 'bounced'];
  const validActions = ['goto_step', 'skip', 'stop', 'wait_extra'];
  for (const b of branches) {
    if (!validConditions.includes(b.condition)) {
      return NextResponse.json({ error: `Invalid condition: ${b.condition}` }, { status: 400 });
    }
    if (!validActions.includes(b.action)) {
      return NextResponse.json({ error: `Invalid action: ${b.action}` }, { status: 400 });
    }
  }

  await ensureBranchesColumn();

  try {
    await prisma.$executeRawUnsafe(
      `UPDATE "SequenceStep" SET "branches" = $1 WHERE "id" = $2`,
      JSON.stringify(branches),
      stepId,
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { prisma } from '@/lib/prisma';

/**
 * Pipeline/Kanban API — manages lead stages for visual pipeline.
 *
 * GET  — returns leads grouped by pipeline stage (with search, richer fields)
 * PATCH — move a lead to a different stage
 */

const PIPELINE_STAGES = [
  { id: 'new', label: 'New', color: '#6b7280' },
  { id: 'contacted', label: 'Contacted', color: '#3b82f6' },
  { id: 'replied', label: 'Replied', color: '#f59e0b' },
  { id: 'qualified', label: 'Qualified', color: '#8b5cf6' },
  { id: 'proposal', label: 'Proposal', color: '#f97316' },
  { id: 'won', label: 'Won', color: '#22c55e' },
  { id: 'lost', label: 'Lost', color: '#ef4444' },
];

export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const search = req.nextUrl.searchParams.get('search')?.trim();

    // Ensure pipelineStage column exists
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "pipelineStage" TEXT DEFAULT 'new'`
    );

    const leads = await prisma.$queryRawUnsafe<Array<{
      id: string; name: string; email: string; field: string; status: string;
      pipelineStage: string | null; tags: string | null; createdAt: Date;
      emailsSent: number; bounceCount: number; website: string | null;
      problem: string | null; lastEmailAt: Date | null;
    }>>(
      `SELECT "id", "name", "email", "field", "status", "pipelineStage", "tags",
              "createdAt", "emailsSent", "bounceCount", "website", "problem", "lastEmailAt"
       FROM "Lead"
       WHERE "unsubscribed" = false
       ${search ? `AND (
         "name" ILIKE '%' || $1 || '%' OR
         "email" ILIKE '%' || $1 || '%' OR
         "field" ILIKE '%' || $1 || '%' OR
         "problem" ILIKE '%' || $1 || '%'
       )` : ''}
       ORDER BY "createdAt" DESC`,
      ...(search ? [search] : [])
    );

    // Group by stage with counts
    const pipeline: Record<string, typeof leads> = {};
    const stageCounts: Record<string, number> = {};
    for (const stage of PIPELINE_STAGES) {
      pipeline[stage.id] = [];
      stageCounts[stage.id] = 0;
    }
    for (const lead of leads) {
      const stage = lead.pipelineStage || 'new';
      if (pipeline[stage]) {
        pipeline[stage].push(lead);
        stageCounts[stage]++;
      } else {
        pipeline['new'].push(lead);
        stageCounts['new']++;
      }
    }

    return NextResponse.json({
      stages: PIPELINE_STAGES,
      pipeline,
      stageCounts,
      totalLeads: leads.length,
    });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { leadId, stage } = await req.json();
  if (!leadId || !stage) {
    return NextResponse.json({ error: 'leadId and stage required' }, { status: 400 });
  }

  const validStages = PIPELINE_STAGES.map(s => s.id);
  if (!validStages.includes(stage)) {
    return NextResponse.json({ error: `Invalid stage. Use: ${validStages.join(', ')}` }, { status: 400 });
  }

  try {
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "pipelineStage" TEXT DEFAULT 'new'`
    );
    await prisma.$executeRawUnsafe(
      `UPDATE "Lead" SET "pipelineStage" = $1 WHERE "id" = $2`,
      stage,
      leadId,
    );

    // Log the stage change
    try {
      await prisma.emailEvent.create({
        data: {
          leadId,
          type: 'stage_changed',
          details: `Moved to ${stage}`,
        },
      });
    } catch { /* ignore */ }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: (err instanceof Error ? err.message : String(err)).slice(0, 200) }, { status: 500 });
  }
}

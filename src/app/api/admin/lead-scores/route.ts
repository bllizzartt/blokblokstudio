import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

const SCORE_WEIGHTS: Record<string, number> = {
  sent: 0,
  opened: 10,
  clicked: 25,
  replied: 50,
  bounced: -20,
  unsubscribed: -100,
};

// GET /api/admin/lead-scores — compute engagement scores for all leads
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    // Group all events by leadId and type, counting occurrences
    const eventGroups = await prisma.emailEvent.groupBy({
      by: ['leadId', 'type'],
      _count: true,
    });

    // Accumulate scores per lead
    const scores: Record<string, number> = {};

    for (const group of eventGroups) {
      const { leadId, type, _count } = group;
      const weight = SCORE_WEIGHTS[type] ?? 0;

      if (!(leadId in scores)) {
        scores[leadId] = 0;
      }

      scores[leadId] += weight * _count;
    }

    return NextResponse.json({ scores });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to compute lead scores: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

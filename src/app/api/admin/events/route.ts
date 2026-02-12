import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/events — list email events with pagination and filters
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const type = searchParams.get('type') || undefined;
  const leadId = searchParams.get('leadId') || undefined;
  const campaignId = searchParams.get('campaignId') || undefined;

  const where: Record<string, unknown> = {};
  if (type) where.type = type;
  if (leadId) where.leadId = leadId;
  if (campaignId) where.campaignId = campaignId;

  try {
    const [events, total] = await Promise.all([
      prisma.emailEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.emailEvent.count({ where }),
    ]);

    // Get summary counts by type
    const summary = await prisma.emailEvent.groupBy({
      by: ['type'],
      _count: true,
    });

    const summaryMap: Record<string, number> = {};
    for (const s of summary) {
      summaryMap[s.type] = s._count;
    }

    return NextResponse.json({
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      summary: summaryMap,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed to fetch events: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

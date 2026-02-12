import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';

// GET /api/admin/inbox — list inbox messages with filters
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const url = req.nextUrl;
    const filter = url.searchParams.get('filter') || 'all'; // all, unread, replies, auto
    const accountId = url.searchParams.get('accountId');
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = 50;
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (filter === 'unread') where.read = false;
    if (filter === 'replies') { where.isAutoReply = false; where.isOOO = false; }
    if (filter === 'auto') { where.isAutoReply = true; }
    if (accountId) where.accountId = accountId;

    const [messages, total] = await Promise.all([
      prisma.inboxMessage.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.inboxMessage.count({ where }),
    ]);

    // Count unread
    const unread = await prisma.inboxMessage.count({ where: { read: false } });

    return NextResponse.json({ messages, total, unread, page, pages: Math.ceil(total / limit) });
  } catch {
    return NextResponse.json({ messages: [], total: 0, unread: 0, page: 1, pages: 0 });
  }
}

// PATCH /api/admin/inbox — mark as read, mark lead status
export async function PATCH(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { action, messageIds, messageId } = await req.json();

    if (action === 'markRead' && messageIds && Array.isArray(messageIds)) {
      await prisma.inboxMessage.updateMany({
        where: { id: { in: messageIds } },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'markAllRead') {
      await prisma.inboxMessage.updateMany({
        where: { read: false },
        data: { read: true },
      });
      return NextResponse.json({ success: true });
    }

    if (action === 'markUnread' && messageId) {
      await prisma.inboxMessage.update({
        where: { id: messageId },
        data: { read: false },
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 400 });
  }
}

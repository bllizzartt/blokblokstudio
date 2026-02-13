import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';
import { sendViaSMTP } from '@/lib/smtp';
import { decrypt } from '@/lib/crypto';

/**
 * POST /api/admin/inbox/reply — send a reply to an inbox message
 *
 * Uses the original message's SMTP account to send,
 * threading via In-Reply-To / References headers so it
 * appears in the same Gmail/Outlook conversation.
 */
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { inboxMessageId, body: replyBody } = await req.json();

    if (!inboxMessageId || !replyBody?.trim()) {
      return NextResponse.json({ error: 'inboxMessageId and body are required' }, { status: 400 });
    }

    // 1. Get the inbox message we're replying to
    const msg = await prisma.inboxMessage.findUnique({ where: { id: inboxMessageId } });
    if (!msg) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // 2. Get the sending account that received this message
    const account = await prisma.sendingAccount.findUnique({ where: { id: msg.accountId } });
    if (!account) {
      return NextResponse.json({ error: 'Sending account not found — may have been deleted' }, { status: 404 });
    }

    if (!account.active) {
      return NextResponse.json({ error: 'Sending account is inactive' }, { status: 400 });
    }

    // 3. Build the reply subject (add Re: if not already present)
    const cleanSubject = msg.subject.replace(/^(Re:\s*)+/i, '').trim();
    const replySubject = `Re: ${cleanSubject}`;

    // 4. Build the reply HTML with quoted original
    const replyHtml = `
<div style="font-family: Arial, Helvetica, sans-serif; font-size: 14px; color: #333;">
  ${replyBody.trim()}
</div>
${account.signature ? `<div style="margin-top: 16px; border-top: 1px solid #eee; padding-top: 12px; font-size: 12px; color: #888;">${account.signature}</div>` : ''}
<div style="margin-top: 24px; padding-left: 12px; border-left: 3px solid #ccc; color: #666; font-size: 13px;">
  <p style="margin: 0 0 4px;">On ${new Date(msg.receivedAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}, ${msg.fromEmail} wrote:</p>
  <p style="margin: 0; white-space: pre-wrap;">${msg.bodyPreview}</p>
</div>`.trim();

    // 5. Decrypt SMTP password and send
    const smtpPass = decrypt(account.smtpPass);
    const result = await sendViaSMTP(
      {
        id: account.id,
        email: account.email,
        smtpHost: account.smtpHost,
        smtpPort: account.smtpPort,
        smtpUser: account.smtpUser,
        smtpPass,
        dailyLimit: account.dailyLimit,
        sentToday: account.sentToday,
      },
      {
        to: msg.fromEmail,
        subject: replySubject,
        html: replyHtml,
        replyTo: account.email,
        inReplyTo: msg.messageId,       // Thread back to original
        references: msg.messageId,       // Full thread chain
        leadId: msg.leadId || undefined,
      }
    );

    if (!result.success) {
      return NextResponse.json({ error: 'Failed to send reply — SMTP error' }, { status: 500 });
    }

    // 6. Mark the message as read
    await prisma.inboxMessage.update({
      where: { id: inboxMessageId },
      data: { read: true },
    });

    // 7. Log the event if this message is linked to a lead
    if (msg.leadId) {
      try {
        await prisma.emailEvent.create({
          data: {
            leadId: msg.leadId,
            type: 'reply_sent',
            accountId: account.id,
            details: `Reply to ${msg.fromEmail}: ${replySubject.slice(0, 80)}`,
          },
        });
      } catch { /* event logging is best-effort */ }
    }

    // 8. Increment sent count for the account
    try {
      await prisma.sendingAccount.update({
        where: { id: account.id },
        data: { sentToday: { increment: 1 } },
      });
    } catch { /* best-effort */ }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
      sentTo: msg.fromEmail,
      subject: replySubject,
    });
  } catch (err) {
    console.error('[Inbox Reply] Error:', err);
    return NextResponse.json(
      { error: `Reply failed: ${(err instanceof Error ? err.message : String(err)).slice(0, 200)}` },
      { status: 500 }
    );
  }
}

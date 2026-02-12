import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { decrypt } from '@/lib/crypto';
import net from 'net';
import tls from 'tls';

/**
 * Cron job: Check IMAP inboxes for replies.
 * Runs alongside the send-campaigns cron.
 *
 * Flow per account:
 * 1. Connect to IMAP server via TLS
 * 2. Fetch recent unseen emails
 * 3. Match sender to leads
 * 4. Detect auto-replies/OOO
 * 5. Store in InboxMessage, update lead status to "replied"
 */

// Auto-reply / OOO detection patterns
const AUTO_REPLY_PATTERNS = [
  /auto[- ]?reply/i,
  /automatic reply/i,
  /out of (the )?office/i,
  /away from (my )?office/i,
  /on (annual |sick )?leave/i,
  /currently (out|away|unavailable)/i,
  /i('m| am) (out|away|on vacation)/i,
  /do[- ]?not[- ]?reply/i,
  /noreply/i,
  /no[- ]?reply/i,
  /this is an automated/i,
  /auto[- ]?generated/i,
  /delivery (status )?notification/i,
  /undeliverable/i,
  /mailer[- ]?daemon/i,
  /postmaster/i,
];

const OOO_PATTERNS = [
  /out of (the )?office/i,
  /away from (my )?office/i,
  /on (annual |sick )?leave/i,
  /on vacation/i,
  /i('m| am) (currently )?(out|away|on leave)/i,
  /limited access to email/i,
  /return(ing)? (on|to the office)/i,
  /back (on|in)/i,
];

function isAutoReply(subject: string, body: string, from: string): boolean {
  const combined = `${subject} ${body} ${from}`;
  return AUTO_REPLY_PATTERNS.some(p => p.test(combined));
}

function isOOO(subject: string, body: string): boolean {
  const combined = `${subject} ${body}`;
  return OOO_PATTERNS.some(p => p.test(combined));
}

/**
 * Simple IMAP client — connects via TLS, fetches recent unseen messages.
 * No external dependencies.
 */
async function fetchImapMessages(
  host: string,
  port: number,
  user: string,
  pass: string,
  maxMessages = 20,
): Promise<Array<{ from: string; to: string; subject: string; bodyPreview: string; messageId: string; date: Date }>> {
  return new Promise((resolve, reject) => {
    const messages: Array<{ from: string; to: string; subject: string; bodyPreview: string; messageId: string; date: Date }> = [];
    let buffer = '';
    let step = 'connect';
    let msgData = '';
    let fetchCount = 0;
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; socket.destroy(); resolve(messages); }
    }, 30000);

    const socket = tls.connect({ host, port, rejectUnauthorized: false }, () => {
      // Connected — wait for server greeting
    });

    socket.setEncoding('utf-8');

    const send = (cmd: string) => {
      socket.write(cmd + '\r\n');
    };

    socket.on('data', (data: string) => {
      buffer += data;

      // Process complete lines
      while (buffer.includes('\r\n')) {
        const lineEnd = buffer.indexOf('\r\n');
        const line = buffer.substring(0, lineEnd);
        buffer = buffer.substring(lineEnd + 2);

        if (step === 'connect' && line.startsWith('* OK')) {
          step = 'login';
          // Sanitize credentials for IMAP LOGIN
          send(`A001 LOGIN "${user.replace(/"/g, '\\"')}" "${pass.replace(/"/g, '\\"')}"`);
        } else if (step === 'login' && line.startsWith('A001 OK')) {
          step = 'select';
          send('A002 SELECT INBOX');
        } else if (step === 'login' && line.startsWith('A001 NO')) {
          clearTimeout(timeout);
          resolved = true;
          socket.destroy();
          reject(new Error('IMAP login failed'));
          return;
        } else if (step === 'select' && line.startsWith('A002 OK')) {
          step = 'search';
          // Search for unseen messages in the last 7 days
          const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          const sinceStr = since.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '');
          send(`A003 SEARCH UNSEEN SINCE "${sinceStr}"`);
        } else if (step === 'search' && line.startsWith('* SEARCH')) {
          const ids = line.replace('* SEARCH', '').trim().split(' ').filter(Boolean);
          const fetchIds = ids.slice(-maxMessages); // Get most recent
          if (fetchIds.length === 0) {
            step = 'logout';
            send('A005 LOGOUT');
          } else {
            step = 'fetch';
            fetchCount = fetchIds.length;
            send(`A004 FETCH ${fetchIds.join(',')} (BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT MESSAGE-ID DATE)] BODY.PEEK[TEXT])`);
          }
        } else if (step === 'search' && line.startsWith('A003 OK')) {
          // No SEARCH results line — no messages
          step = 'logout';
          send('A005 LOGOUT');
        } else if (step === 'fetch') {
          if (line.startsWith('A004 OK')) {
            // All fetched, parse accumulated data
            step = 'logout';
            send('A005 LOGOUT');
          } else {
            msgData += line + '\r\n';
          }
        } else if (step === 'logout' && (line.startsWith('A005 OK') || line.startsWith('* BYE'))) {
          clearTimeout(timeout);
          resolved = true;
          socket.destroy();

          // Parse fetched messages
          if (msgData) {
            const parts = msgData.split(/^\* \d+ FETCH/m).filter(Boolean);
            for (const part of parts) {
              try {
                const fromMatch = part.match(/^From:\s*(.+)/mi);
                const toMatch = part.match(/^To:\s*(.+)/mi);
                const subjectMatch = part.match(/^Subject:\s*(.+)/mi);
                const msgIdMatch = part.match(/^Message-ID:\s*(.+)/mi);
                const dateMatch = part.match(/^Date:\s*(.+)/mi);

                const from = fromMatch?.[1]?.trim() || '';
                const fromEmail = from.match(/<(.+?)>/)?.[1] || from;

                if (fromEmail) {
                  // Extract body preview (first 500 chars of text part)
                  const textParts = part.split(/\r\n\r\n/);
                  const bodyText = textParts.slice(1).join('\n').replace(/[)\r\n]+$/g, '').trim();

                  messages.push({
                    from: fromEmail.toLowerCase(),
                    to: (toMatch?.[1]?.match(/<(.+?)>/)?.[1] || toMatch?.[1] || '').trim().toLowerCase(),
                    subject: (subjectMatch?.[1] || '(No Subject)').trim(),
                    bodyPreview: bodyText.slice(0, 500),
                    messageId: (msgIdMatch?.[1] || `gen-${Date.now()}-${Math.random()}`).trim(),
                    date: dateMatch?.[1] ? new Date(dateMatch[1].trim()) : new Date(),
                  });
                }
              } catch {
                // Skip malformed message
              }
            }
          }

          resolve(messages);
        }
      }
    });

    socket.on('error', () => {
      clearTimeout(timeout);
      if (!resolved) { resolved = true; resolve(messages); }
    });

    socket.on('close', () => {
      clearTimeout(timeout);
      if (!resolved) { resolved = true; resolve(messages); }
    });
  });
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // Get accounts with IMAP configured
    const accounts = await prisma.sendingAccount.findMany({
      where: {
        active: true,
        imapHost: { not: null },
        imapUser: { not: null },
        imapPass: { not: null },
      },
    });

    if (accounts.length === 0) {
      return NextResponse.json({ message: 'No accounts with IMAP configured', results: [] });
    }

    let totalNew = 0;
    let totalReplies = 0;
    let totalAutoReplies = 0;

    for (const account of accounts) {
      if (!account.imapHost || !account.imapUser || !account.imapPass) continue;

      try {
        const messages = await fetchImapMessages(
          account.imapHost,
          account.imapPort,
          account.imapUser,
          decrypt(account.imapPass),
          20,
        );

        for (const msg of messages) {
          // Deduplicate by messageId
          const exists = await prisma.inboxMessage.findUnique({
            where: { messageId: msg.messageId },
          });
          if (exists) continue;

          // Match to a lead
          const lead = await prisma.lead.findUnique({
            where: { email: msg.from },
          });

          const autoReply = isAutoReply(msg.subject, msg.bodyPreview, msg.from);
          const ooo = isOOO(msg.subject, msg.bodyPreview);

          // Store message
          await prisma.inboxMessage.create({
            data: {
              accountId: account.id,
              leadId: lead?.id || null,
              fromEmail: msg.from,
              toEmail: msg.to || account.email,
              subject: msg.subject,
              bodyPreview: msg.bodyPreview.slice(0, 500),
              messageId: msg.messageId,
              isAutoReply: autoReply,
              isOOO: ooo,
              receivedAt: msg.date,
            },
          });

          totalNew++;

          if (autoReply) {
            totalAutoReplies++;
          } else if (lead) {
            totalReplies++;

            // Auto-update lead status to "replied"
            try {
              await prisma.lead.update({
                where: { id: lead.id },
                data: { status: 'replied' },
              });
            } catch { /* column might not exist */ }

            // Pause any active sequences for this lead (they replied!)
            try {
              await prisma.sequenceEnrollment.updateMany({
                where: { leadId: lead.id, status: 'active' },
                data: { status: 'replied' },
              });
            } catch { /* ignore */ }

            // Log reply event
            try {
              await prisma.emailEvent.create({
                data: {
                  leadId: lead.id,
                  accountId: account.id,
                  type: 'replied',
                  details: `Subject: ${msg.subject.slice(0, 100)}`,
                },
              });
            } catch { /* ignore */ }
          }
        }

        results.push(`${account.email}: fetched ${messages.length} messages, ${totalNew} new`);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        results.push(`${account.email}: IMAP error — ${errMsg.slice(0, 100)}`);
      }
    }

    return NextResponse.json({
      message: `Checked ${accounts.length} inboxes: ${totalNew} new messages, ${totalReplies} lead replies, ${totalAutoReplies} auto-replies`,
      results,
      totalNew,
      totalReplies,
      totalAutoReplies,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg.slice(0, 200), results }, { status: 500 });
  }
}

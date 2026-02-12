import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendViaSMTP } from '@/lib/smtp';
import { decrypt } from '@/lib/crypto';

/**
 * Warmup Cron — sends warmup emails between your own accounts.
 *
 * Strategy (like Smartlead):
 * 1. Pair accounts together (A sends to B, B sends to C, etc.)
 * 2. Send conversational warmup emails that look natural
 * 3. Gradually ramp up volume based on warmup phase
 * 4. Track inbox vs spam placement
 *
 * Runs alongside the send-campaigns cron.
 */

// Natural-looking warmup email subjects and bodies
const WARMUP_CONVERSATIONS = [
  { subject: 'Quick question about the project', body: 'Hey, just wanted to follow up on our earlier discussion. Do you have the updated timeline? Let me know when you get a chance. Thanks!' },
  { subject: 'Meeting notes from today', body: 'Hi there, I just wanted to share a quick summary of our meeting today. The key takeaways were that we need to finalize the proposal by next week. Let me know if you have any questions.' },
  { subject: 'Re: Document review', body: 'Thanks for sending that over. I had a chance to look through it and everything looks good. I\'ll send my final notes by end of day tomorrow.' },
  { subject: 'Coffee catch-up?', body: 'Hey! It\'s been a while since we last connected. Want to grab coffee sometime this week? I\'d love to hear how things are going on your end.' },
  { subject: 'Re: Budget update', body: 'Got it, thanks for the heads up. I\'ll review the numbers and get back to you by Thursday. Let me know if anything else comes up in the meantime.' },
  { subject: 'Team update', body: 'Hi team, just a quick update on our progress this week. We\'re on track with our goals and I\'ll share a more detailed report on Friday. Thanks for all the hard work!' },
  { subject: 'Checking in', body: 'Hi! Hope you\'re having a great week. Just wanted to check in and see how the new system is working out. Any feedback so far?' },
  { subject: 'Article I thought you\'d like', body: 'Hey, came across this article about industry trends and thought of you. Some really interesting insights about where things are heading. Let me know what you think!' },
  { subject: 'Re: Schedule change', body: 'No problem at all, the new time works for me. I\'ll update my calendar. See you then!' },
  { subject: 'Thanks for your help', body: 'Just wanted to say thanks for helping out with that issue yesterday. Really appreciate you taking the time. Let me know if I can return the favor.' },
  { subject: 'Upcoming event', body: 'Hi! I saw there\'s an industry event coming up next month. Are you planning to attend? Would be great to meet up there if you are.' },
  { subject: 'Re: Feedback request', body: 'Happy to provide feedback! I think overall the approach is solid. A few minor suggestions: consider adding more context in the intro section. Otherwise, looks great.' },
  { subject: 'Weekend plans?', body: 'Hey! Any fun plans for the weekend? I\'m thinking about trying that new restaurant downtown. Let me know if you want to join!' },
  { subject: 'Re: Contract update', body: 'Thanks for the update. I\'ve reviewed the changes and everything looks good on our end. I\'ll get the signed version back to you by Monday.' },
  { subject: 'Quick sync tomorrow?', body: 'Hi, would you have 15 minutes tomorrow for a quick sync? I want to discuss a few things before the presentation on Wednesday. Let me know what time works.' },
];

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get accounts with warmup enabled
    const accounts = await prisma.sendingAccount.findMany({
      where: { active: true, warmupEnabled: true },
    });

    if (accounts.length < 2) {
      return NextResponse.json({
        message: 'Need at least 2 active accounts with warmup enabled to run warmup',
        sent: 0,
      });
    }

    const today = new Date().toISOString().slice(0, 10);
    let totalSent = 0;
    const results: string[] = [];

    for (let i = 0; i < accounts.length; i++) {
      const sender = accounts[i];

      // Check how many warmup emails sent today
      let warmupLog = await prisma.warmupLog.findUnique({
        where: { accountId_date: { accountId: sender.id, date: today } },
      });

      if (!warmupLog) {
        warmupLog = await prisma.warmupLog.create({
          data: { accountId: sender.id, date: today },
        });
      }

      const remaining = sender.warmupDaily - warmupLog.sent;
      if (remaining <= 0) {
        results.push(`${sender.email}: daily warmup limit reached (${warmupLog.sent}/${sender.warmupDaily})`);
        continue;
      }

      // Check send window
      const nowHour = new Date().getUTCHours();
      if (nowHour < sender.sendWindowStart || nowHour >= sender.sendWindowEnd) {
        results.push(`${sender.email}: outside send window (${sender.sendWindowStart}-${sender.sendWindowEnd} UTC)`);
        continue;
      }

      // Check weekday
      const dayOfWeek = new Date().getUTCDay();
      const allowedDays = sender.sendWeekdays.split(',').map(d => parseInt(d));
      if (!allowedDays.includes(dayOfWeek)) {
        results.push(`${sender.email}: not a sending day`);
        continue;
      }

      // Send warmup emails to other accounts (round-robin)
      const toSend = Math.min(remaining, 3); // Max 3 per cron run to spread throughout day
      let sentThisRun = 0;

      for (let j = 0; j < toSend; j++) {
        // Pick a different account to send to
        const recipientIdx = (i + j + 1) % accounts.length;
        const recipient = accounts[recipientIdx];

        // Pick a random conversation
        const conv = WARMUP_CONVERSATIONS[Math.floor(Math.random() * WARMUP_CONVERSATIONS.length)];

        // Add slight randomization to look natural
        const subject = conv.subject + (Math.random() > 0.7 ? ' ' : '');

        try {
          const result = await sendViaSMTP(sender, {
            to: recipient.email,
            subject,
            html: `<p>${conv.body}</p>`,
            text: conv.body,
          });

          if (result.success) {
            sentThisRun++;
            totalSent++;
          }
        } catch {
          // SMTP error
        }

        // Space out sends
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
      }

      // Update warmup log
      if (sentThisRun > 0) {
        await prisma.warmupLog.update({
          where: { accountId_date: { accountId: sender.id, date: today } },
          data: { sent: { increment: sentThisRun } },
        });
      }

      results.push(`${sender.email}: sent ${sentThisRun} warmup emails`);
    }

    return NextResponse.json({
      message: `Warmup: sent ${totalSent} emails across ${accounts.length} accounts`,
      sent: totalSent,
      results,
    });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg.slice(0, 200) }, { status: 500 });
  }
}

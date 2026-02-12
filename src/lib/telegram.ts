/**
 * Send a Telegram message when a new lead comes in.
 *
 * Setup:
 * 1. Message @BotFather on Telegram → /newbot → follow prompts → copy the token
 * 2. Start a chat with your new bot (search its username)
 * 3. Send any message to the bot
 * 4. Visit: https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates
 * 5. Find "chat":{"id": 123456789} — that's your TELEGRAM_CHAT_ID
 * 6. Add both values to your .env file
 */

export async function notifyTelegram(lead: {
  name: string;
  email: string;
  field: string;
  website: string | null;
  problem: string;
}) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId || token === 'YOUR_BOT_TOKEN_HERE') {
    console.log('[Telegram] Skipped — bot token or chat ID not configured');
    return;
  }

  const message = [
    '🔥 New Lead from Funnel!',
    '',
    `👤 Name: ${lead.name}`,
    `📧 Email: ${lead.email}`,
    `💼 Industry: ${lead.field}`,
    `🌐 Website: ${lead.website || 'No website yet'}`,
    `❓ Challenge: ${lead.problem}`,
    '',
    `📅 ${new Date().toLocaleString('en-US', { timeZone: 'America/New_York' })}`,
  ].join('\n');

  try {
    const res = await fetch(
      `https://api.telegram.org/bot${token}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[Telegram] Failed to send:', err);
    }
  } catch (err) {
    console.error('[Telegram] Error:', err);
  }
}

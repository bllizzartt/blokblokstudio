/**
 * Fire webhooks to all configured URLs.
 * Set WEBHOOK_URLS env var to comma-separated HTTPS URLs.
 */
export async function fireWebhook(event: string, data: Record<string, unknown>) {
  const urls = (process.env.WEBHOOK_URLS || '').split(',').filter(Boolean);
  if (urls.length === 0) return;

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  for (const url of urls) {
    try {
      if (!url.startsWith('https://')) continue;
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      console.error(`[Webhook] Failed to fire to ${url}`);
    }
  }
}

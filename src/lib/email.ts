import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Strip HTML tags for plain-text email version (deliverability boost).
 */
function htmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li>/gi, '- ')
    .replace(/<hr[^>]*>/gi, '\n---\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&mdash;/g, '—')
    .replace(/&ldquo;/g, '"')
    .replace(/&rdquo;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Send yourself a notification email when a new lead comes in.
 */
export async function notifyNewLead(lead: {
  name: string;
  email: string;
  field: string;
  website: string | null;
  problem: string;
}) {
  const to = process.env.NOTIFICATION_EMAIL;
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  if (!to) {
    console.log('[Email] Skipped notification — NOTIFICATION_EMAIL not set');
    return;
  }

  try {
    await resend.emails.send({
      from: `Blok Blok Funnel <${from}>`,
      to,
      subject: `New Lead: ${lead.name} (${lead.field})`,
      html: `
        <div style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #f97316; margin-bottom: 24px;">New Audit Request</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600; width: 120px;">Name</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${lead.name}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600;">Email</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;"><a href="mailto:${lead.email}">${lead.email}</a></td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600;">Industry</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${lead.field}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-weight: 600;">Website</td>
              <td style="padding: 12px 0; border-bottom: 1px solid #eee;">${lead.website || '<em>No website yet</em>'}</td>
            </tr>
            <tr>
              <td style="padding: 12px 0; font-weight: 600; vertical-align: top;">Challenge</td>
              <td style="padding: 12px 0;">${lead.problem}</td>
            </tr>
          </table>
          <p style="margin-top: 24px; color: #666; font-size: 14px;">
            Reply directly to this lead: <a href="mailto:${lead.email}">${lead.email}</a>
          </p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[Email] Failed to send notification:', err);
  }
}

/**
 * Send a campaign email to a single lead.
 * Includes deliverability best practices:
 * - Plain text version alongside HTML
 * - Reply-To header
 * - List-Unsubscribe header (one-click)
 * - Proper From name matching domain
 */
export async function sendCampaignEmail({
  to,
  subject,
  html,
  leadId,
}: {
  to: string;
  subject: string;
  html: string;
  leadId: string;
}) {
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const replyTo = process.env.NOTIFICATION_EMAIL || from;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?id=${leadId}`;

  const text = htmlToText(html) + `\n\n---\nBlok Blok Studio — Digital Agency for Ambitious Brands\nUnsubscribe: ${unsubscribeUrl}`;

  try {
    const { error } = await resend.emails.send({
      from: `Blok Blok Studio <${from}>`,
      to,
      replyTo,
      subject,
      html,
      text,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
    });

    if (error) {
      console.error(`[Email] Failed to send to ${to}:`, error);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`[Email] Exception sending to ${to}:`, err);
    return false;
  }
}

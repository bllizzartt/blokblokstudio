import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

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
      subject: `🔥 New Lead: ${lead.name} (${lead.field})`,
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
 */
export async function sendCampaignEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const from = process.env.EMAIL_FROM || 'onboarding@resend.dev';

  const { error } = await resend.emails.send({
    from: `Blok Blok Studio <${from}>`,
    to,
    subject,
    html,
  });

  if (error) {
    console.error(`[Email] Failed to send to ${to}:`, error);
    return false;
  }
  return true;
}

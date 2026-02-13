/**
 * Stealth Email Tracking — Anti-Detection System
 *
 * Gmail's RETVec AI, Outlook's LLM, and Yahoo's filters all scan for:
 * 1. Standard 1x1 tracking pixels (width="1" height="1" style="display:none")
 * 2. URL rewriting patterns (domain.com/api/track?url=encoded...)
 * 3. Consistent pixel placement (always at end of body)
 * 4. Predictable parameter structures (t=open&lid=X&cid=Y)
 *
 * This system avoids all those patterns through:
 * - Randomized pixel dimensions and styles
 * - Variable injection positions (top, middle, bottom)
 * - Obfuscated parameter names that rotate
 * - NO click URL rewriting (biggest detection vector)
 * - Server-side click logging via redirect API instead
 */

// Rotate parameter name sets to avoid fingerprinting
const PARAM_SETS = [
  { lead: 'r', campaign: 's', type: 'e' },
  { lead: 'u', campaign: 'v', type: 'a' },
  { lead: 'p', campaign: 'q', type: 'k' },
  { lead: 'x', campaign: 'z', type: 'w' },
  { lead: 'h', campaign: 'j', type: 'n' },
];

function getParamSet(): typeof PARAM_SETS[0] {
  return PARAM_SETS[Math.floor(Math.random() * PARAM_SETS.length)];
}

// Randomized pixel styles that ISPs don't flag
const PIXEL_VARIANTS = [
  // Spacer GIF pattern (very common in legitimate emails)
  (src: string) => `<img src="${src}" width="${2 + Math.floor(Math.random() * 3)}" height="${1 + Math.floor(Math.random() * 2)}" alt="" style="border:0;outline:none" />`,
  // Logo footer pattern (looks like a small branding element)
  (src: string) => `<img src="${src}" width="${4 + Math.floor(Math.random() * 8)}" height="${2 + Math.floor(Math.random() * 4)}" alt="" style="max-height:4px;opacity:0.01" />`,
  // Table cell spacer (common in HTML email templates)
  (src: string) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="font-size:1px;line-height:1px"><img src="${src}" alt="" style="display:block;border:0" width="${1 + Math.floor(Math.random() * 5)}" height="1" /></td></tr></table>`,
  // Paragraph embedded (blends into content)
  (src: string) => `<p style="margin:0;padding:0;font-size:0;line-height:0"><img src="${src}" alt="" style="border:0" width="${1 + Math.floor(Math.random() * 3)}" height="1" /></p>`,
];

/**
 * Get the tracking base URL.
 * Uses TRACKING_DOMAIN env var if set (custom CNAME domain like t.yourdomain.com),
 * otherwise falls back to the app's base URL.
 *
 * Custom tracking domains prevent ISPs from associating your tracking infrastructure
 * with your main sending domain — isolates reputation risk.
 *
 * Setup: Create a CNAME record: t.yourdomain.com → your-app.vercel.app
 * Then set TRACKING_DOMAIN=https://t.yourdomain.com in env
 */
function getTrackingBaseUrl(): string {
  if (process.env.TRACKING_DOMAIN) {
    return process.env.TRACKING_DOMAIN.replace(/\/$/, ''); // Remove trailing slash
  }
  return process.env.NEXT_PUBLIC_BASE_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000');
}

/**
 * Generate a tracking URL with obfuscated parameters.
 * Rotates param names so ISPs can't pattern-match a static structure.
 */
function buildTrackUrl(baseUrl: string, leadId: string, campaignId?: string): string {
  const params = getParamSet();
  const segments = [
    `${params.type}=o`,
    `${params.lead}=${encodeURIComponent(leadId)}`,
  ];
  if (campaignId) {
    segments.push(`${params.campaign}=${encodeURIComponent(campaignId)}`);
  }
  // Add a cache-buster that looks like a session token
  segments.push(`_=${Date.now().toString(36)}`);
  // Shuffle parameter order (ISPs track consistent ordering)
  for (let i = segments.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [segments[i], segments[j]] = [segments[j], segments[i]];
  }
  return `${baseUrl}/api/track?${segments.join('&')}`;
}

/**
 * Inject stealth open tracking into email HTML.
 *
 * Key anti-detection features:
 * - Randomized pixel dimensions (NOT always 1x1)
 * - Variable injection position (not always at </body>)
 * - Obfuscated and rotated parameter names
 * - Multiple pixel wrapper styles that mimic legitimate email patterns
 * - NO click URL rewriting (eliminated biggest detection vector)
 *
 * Click tracking is handled server-side through the redirect API,
 * which means original URLs stay intact in the email — no rewriting.
 */
export function injectTracking(html: string, leadId: string, campaignId?: string): string {
  const baseUrl = getTrackingBaseUrl();

  const trackUrl = buildTrackUrl(baseUrl, leadId, campaignId);

  // Pick a random pixel variant
  const pixelFn = PIXEL_VARIANTS[Math.floor(Math.random() * PIXEL_VARIANTS.length)];
  const pixel = pixelFn(trackUrl);

  // Randomize injection position
  const positions = ['top', 'middle', 'bottom'] as const;
  const position = positions[Math.floor(Math.random() * positions.length)];

  let tracked = html;

  switch (position) {
    case 'top':
      // Inject after <body> or at the very start
      if (tracked.includes('<body')) {
        tracked = tracked.replace(/<body[^>]*>/, `$&${pixel}`);
      } else {
        tracked = pixel + tracked;
      }
      break;

    case 'middle':
      // Inject after a random </p> or </div> tag
      const closingTags = [...tracked.matchAll(/<\/(?:p|div|td|tr)>/gi)];
      if (closingTags.length > 2) {
        const targetIdx = Math.floor(closingTags.length / 2) + Math.floor(Math.random() * Math.floor(closingTags.length / 3));
        const tag = closingTags[Math.min(targetIdx, closingTags.length - 1)];
        if (tag.index !== undefined) {
          const insertAt = tag.index + tag[0].length;
          tracked = tracked.slice(0, insertAt) + pixel + tracked.slice(insertAt);
        }
      } else {
        // Fallback to bottom
        tracked = tracked.includes('</body>')
          ? tracked.replace('</body>', `${pixel}</body>`)
          : tracked + pixel;
      }
      break;

    case 'bottom':
    default:
      tracked = tracked.includes('</body>')
        ? tracked.replace('</body>', `${pixel}</body>`)
        : tracked + pixel;
      break;
  }

  // NOTE: Click tracking URLs are NOT rewritten here anymore.
  // Original links stay intact in the email (massive deliverability improvement).
  // Click tracking is handled by optional server-side redirect links
  // that the campaign builder can opt into per-link.

  return tracked;
}

/**
 * Generate a click-tracking redirect URL for a specific link.
 * Used by the campaign builder to optionally wrap specific CTAs,
 * NOT applied to all links (which ISPs flag as suspicious).
 */
export function buildClickTrackUrl(
  originalUrl: string,
  leadId: string,
  campaignId?: string,
): string {
  const baseUrl = getTrackingBaseUrl();

  const params = getParamSet();
  return `${baseUrl}/api/track?${params.type}=c&${params.lead}=${encodeURIComponent(leadId)}${campaignId ? `&${params.campaign}=${encodeURIComponent(campaignId)}` : ''}&d=${encodeURIComponent(originalUrl)}&_=${Date.now().toString(36)}`;
}

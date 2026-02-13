import dns from 'dns';
import { promisify } from 'util';
import { prisma } from './prisma';

const resolve4 = promisify(dns.resolve4);
const resolveMx = promisify(dns.resolveMx);
const resolvePtr = promisify(dns.resolvePtr);
const resolveTxt = promisify(dns.resolveTxt);

// ── IP Blacklists (comprehensive — covers major ISP reputation feeds) ──
const IP_BLACKLISTS = [
  'zen.spamhaus.org',        // Most important — used by 80%+ of ISPs
  'sbl.spamhaus.org',        // Spamhaus Block List (known spam sources)
  'xbl.spamhaus.org',        // Exploits Block List (hijacked machines)
  'pbl.spamhaus.org',        // Policy Block List (dynamic IPs that shouldn't send)
  'bl.spamcop.net',          // SpamCop (complaint-based)
  'b.barracudacentral.org',  // Barracuda (enterprise spam filter)
  'dnsbl.sorbs.net',         // SORBS (open relays, spam sources)
  'spam.dnsbl.sorbs.net',    // SORBS spam only
  'dnsbl-1.uceprotect.net',  // UCEPROTECT Level 1 (single IPs)
  'psbl.surriel.com',        // Passive Spam Block List
  'all.s5h.net',             // S5H (trap-based)
  'dnsbl.dronebl.org',       // DroneBL (hijacked machines)
  'ix.dnsbl.manitu.net',     // German anti-spam
  'truncate.gbudb.net',      // GBUdb (reputation-based)
  'bl.mailspike.net',        // Mailspike
];

// ── Domain Blacklists ──
const DOMAIN_BLACKLISTS = [
  'dbl.spamhaus.org',        // Spamhaus Domain Block List
  'multi.surbl.org',         // SURBL (spam URIs)
  'black.uribl.com',         // URIBL (URI blacklist)
  'rhsbl.sorbs.net',         // SORBS right-hand-side BL
];

// ── Severity Classifications ──
const CRITICAL_BLACKLISTS = ['zen.spamhaus.org', 'sbl.spamhaus.org', 'bl.spamcop.net'];
const HIGH_SEVERITY = ['b.barracudacentral.org', 'dbl.spamhaus.org', 'xbl.spamhaus.org'];

// ── Delisting Info ──
// Maps each blacklist to its delisting method: auto (wait it out) or manual (submit removal request)

export interface DelistInfo {
  type: 'auto' | 'manual';
  /** Approximate days to auto-removal (auto type only) */
  autoDays?: number;
  /** Human-readable note shown to the user */
  note: string;
  /** URL for manual delisting request (manual type only) */
  url?: string;
}

export const BLACKLIST_DELIST_INFO: Record<string, DelistInfo> = {
  // ── Auto-delist (no action needed — wait it out) ──
  'bl.spamcop.net': {
    type: 'auto',
    autoDays: 2,
    note: 'Auto-removes 24-48h after complaints stop',
  },
  'dnsbl-1.uceprotect.net': {
    type: 'auto',
    autoDays: 7,
    note: 'Auto-removes after 7 days if no new abuse',
  },
  'psbl.surriel.com': {
    type: 'auto',
    note: 'Auto-removes when spam activity stops',
  },
  'dnsbl.dronebl.org': {
    type: 'auto',
    note: 'Auto-removes when abuse stops',
  },
  'truncate.gbudb.net': {
    type: 'auto',
    note: 'Reputation-based — auto-adjusts with improved behavior',
  },
  'all.s5h.net': {
    type: 'auto',
    note: 'Trap-based — auto-removes when spam stops',
  },
  'ix.dnsbl.manitu.net': {
    type: 'auto',
    note: 'Auto-removes when spam activity stops',
  },

  // ── Manual delist (IP blacklists — submit removal request) ──
  'zen.spamhaus.org': {
    type: 'manual',
    note: 'Submit removal request via Spamhaus checker',
    url: 'https://check.spamhaus.org/',
  },
  'sbl.spamhaus.org': {
    type: 'manual',
    note: 'Submit removal request via Spamhaus checker',
    url: 'https://check.spamhaus.org/',
  },
  'xbl.spamhaus.org': {
    type: 'manual',
    note: 'Submit removal request via Spamhaus checker',
    url: 'https://check.spamhaus.org/',
  },
  'pbl.spamhaus.org': {
    type: 'manual',
    note: 'Submit removal request via Spamhaus checker',
    url: 'https://check.spamhaus.org/',
  },
  'b.barracudacentral.org': {
    type: 'manual',
    note: 'Submit IP removal request to Barracuda',
    url: 'https://barracudacentral.org/rbl/removal-request',
  },
  'dnsbl.sorbs.net': {
    type: 'manual',
    note: 'Submit removal request to SORBS',
    url: 'http://www.sorbs.net/cgi-bin/support',
  },
  'spam.dnsbl.sorbs.net': {
    type: 'manual',
    note: 'Submit removal request to SORBS',
    url: 'http://www.sorbs.net/cgi-bin/support',
  },
  'bl.mailspike.net': {
    type: 'manual',
    note: 'Look up and request removal via Mailspike',
    url: 'https://mailspike.org/iplookup.html',
  },

  // ── Manual delist (Domain blacklists) ──
  'dbl.spamhaus.org': {
    type: 'manual',
    note: 'Submit removal request via Spamhaus checker',
    url: 'https://check.spamhaus.org/',
  },
  'multi.surbl.org': {
    type: 'manual',
    note: 'Request analysis and removal via SURBL',
    url: 'http://www.surbl.org/surbl-analysis',
  },
  'black.uribl.com': {
    type: 'manual',
    note: 'Submit removal request to URIBL',
    url: 'https://admin.uribl.com/',
  },
  'rhsbl.sorbs.net': {
    type: 'manual',
    note: 'Submit removal request to SORBS',
    url: 'http://www.sorbs.net/cgi-bin/support',
  },
};

/**
 * Get delisting info for a blacklist hostname.
 * Returns null if unknown.
 */
export function getDelistInfo(blacklist: string): DelistInfo | null {
  return BLACKLIST_DELIST_INFO[blacklist] || null;
}

/**
 * Check if an IP is listed on a specific DNSBL.
 */
async function checkIpBlacklist(ip: string, bl: string): Promise<{ listed: boolean; result?: string }> {
  const reversed = ip.split('.').reverse().join('.');
  try {
    const result = await resolve4(`${reversed}.${bl}`);
    return { listed: true, result: result[0] };
  } catch {
    return { listed: false };
  }
}

/**
 * Check if a domain is listed on a domain blacklist.
 */
async function checkDomainBlacklist(domain: string, bl: string): Promise<{ listed: boolean; result?: string }> {
  try {
    const result = await resolve4(`${domain}.${bl}`);
    return { listed: true, result: result[0] };
  } catch {
    return { listed: false };
  }
}

/**
 * Full blacklist scan for an IP and optional domain.
 * Returns detailed results with severity classifications.
 */
export async function fullBlacklistScan(ip: string, domain?: string): Promise<{
  clean: boolean;
  ip: string;
  domain: string | null;
  ipResults: { blacklist: string; listed: boolean; severity: 'critical' | 'high' | 'medium'; result?: string }[];
  domainResults: { blacklist: string; listed: boolean; severity: 'critical' | 'high' | 'medium'; result?: string }[];
  listedCount: number;
  criticalListings: string[];
  highListings: string[];
  score: number; // 0 = fully clean, 100 = heavily blacklisted
}> {
  // IP checks
  const ipChecks = await Promise.allSettled(
    IP_BLACKLISTS.map(async bl => {
      const result = await checkIpBlacklist(ip, bl);
      const severity = CRITICAL_BLACKLISTS.includes(bl) ? 'critical' as const
        : HIGH_SEVERITY.includes(bl) ? 'high' as const : 'medium' as const;
      return { blacklist: bl, ...result, severity };
    })
  );

  const ipResults = ipChecks
    .filter((c): c is PromiseFulfilledResult<{ blacklist: string; listed: boolean; severity: 'critical' | 'high' | 'medium'; result?: string }> => c.status === 'fulfilled')
    .map(c => c.value);

  // Domain checks
  const domainResults: typeof ipResults = [];
  if (domain) {
    const domChecks = await Promise.allSettled(
      DOMAIN_BLACKLISTS.map(async bl => {
        const result = await checkDomainBlacklist(domain, bl);
        const severity = bl === 'dbl.spamhaus.org' ? 'critical' as const
          : bl === 'multi.surbl.org' ? 'high' as const : 'medium' as const;
        return { blacklist: bl, ...result, severity };
      })
    );
    for (const check of domChecks) {
      if (check.status === 'fulfilled') domainResults.push(check.value);
    }
  }

  const allListed = [...ipResults, ...domainResults].filter(r => r.listed);
  const criticalListings = allListed.filter(r => r.severity === 'critical').map(r => r.blacklist);
  const highListings = allListed.filter(r => r.severity === 'high').map(r => r.blacklist);

  // Score: critical = 30 pts, high = 15 pts, medium = 5 pts
  const score = Math.min(100,
    criticalListings.length * 30 +
    highListings.length * 15 +
    allListed.filter(r => r.severity === 'medium').length * 5
  );

  return {
    clean: allListed.length === 0,
    ip,
    domain: domain || null,
    ipResults,
    domainResults,
    listedCount: allListed.length,
    criticalListings,
    highListings,
    score,
  };
}

/**
 * Automated blacklist monitor — checks VPS IP + sending domains.
 * Called by cron. Auto-pauses all sending if listed on critical blacklists.
 *
 * Returns actions taken (e.g. "paused_sending", "alert_only").
 */
export async function runBlacklistMonitor(): Promise<{
  checks: { target: string; targetType: string; clean: boolean; listedOn: string[]; action: string | null }[];
  allClear: boolean;
  actionsTaken: string[];
}> {
  const checks: { target: string; targetType: string; clean: boolean; listedOn: string[]; action: string | null }[] = [];
  const actionsTaken: string[] = [];

  // 1. Check VPS IP (from env)
  const vpsIp = process.env.VPS_IP || process.env.MAILCOW_IP;
  if (vpsIp) {
    const scan = await fullBlacklistScan(vpsIp);
    const listedOn = [...scan.ipResults, ...scan.domainResults].filter(r => r.listed).map(r => r.blacklist);
    let action: string | null = null;

    if (scan.criticalListings.length > 0) {
      // CRITICAL: Auto-pause all sending
      await pauseAllSending(`VPS IP ${vpsIp} listed on critical blacklist(s): ${scan.criticalListings.join(', ')}`);
      action = 'paused_sending';
      actionsTaken.push(`CRITICAL: Paused all sending — VPS IP ${vpsIp} listed on ${scan.criticalListings.join(', ')}`);
    } else if (scan.highListings.length > 0) {
      action = 'alert_only';
      actionsTaken.push(`WARNING: VPS IP ${vpsIp} listed on ${scan.highListings.join(', ')} — monitor closely`);
    }

    // Save check result
    try {
      await prisma.blacklistCheck.create({
        data: {
          target: vpsIp,
          targetType: 'ip',
          clean: scan.clean,
          listedOn: listedOn.length > 0 ? JSON.stringify(listedOn) : null,
          totalChecked: scan.ipResults.length,
          autoAction: action,
        },
      });
    } catch { /* table may not exist */ }

    checks.push({ target: vpsIp, targetType: 'ip', clean: scan.clean, listedOn, action });
  }

  // 2. Check sending account IPs (resolve from MX/A records)
  try {
    const accounts = await prisma.sendingAccount.findMany({
      where: { active: true },
      select: { email: true },
    });

    const domains = [...new Set(accounts.map(a => a.email.split('@')[1]).filter(Boolean))];

    for (const domain of domains) {
      const scan = await fullBlacklistScan(
        await resolveIPForDomain(domain) || '0.0.0.0',
        domain
      );
      const listedOn = [...scan.ipResults, ...scan.domainResults].filter(r => r.listed).map(r => r.blacklist);
      let action: string | null = null;

      if (scan.criticalListings.length > 0) {
        action = 'paused_sending';
        actionsTaken.push(`CRITICAL: Domain ${domain} listed on ${scan.criticalListings.join(', ')}`);
      } else if (listedOn.length > 0) {
        action = 'alert_only';
      }

      try {
        await prisma.blacklistCheck.create({
          data: {
            target: domain,
            targetType: 'domain',
            clean: scan.clean,
            listedOn: listedOn.length > 0 ? JSON.stringify(listedOn) : null,
            totalChecked: scan.ipResults.length + scan.domainResults.length,
            autoAction: action,
          },
        });
      } catch { /* table may not exist */ }

      checks.push({ target: domain, targetType: 'domain', clean: scan.clean, listedOn, action });
    }
  } catch { /* ignore account check failures */ }

  return {
    checks,
    allClear: checks.every(c => c.clean),
    actionsTaken,
  };
}

/**
 * Auto-pause all sending accounts when blacklisted.
 */
async function pauseAllSending(reason: string): Promise<void> {
  try {
    await prisma.sendingAccount.updateMany({
      where: { active: true },
      data: { active: false },
    });

    // Log the auto-pause event
    await prisma.auditLog.create({
      data: {
        action: 'blacklist_auto_pause',
        details: reason,
      },
    });

    console.error(`[BLACKLIST] 🚨 ALL SENDING PAUSED: ${reason}`);
  } catch (err) {
    console.error('[BLACKLIST] Failed to auto-pause:', err);
  }
}

/**
 * Get blacklist history (last 30 days).
 */
export async function getBlacklistHistory(days: number = 30): Promise<{
  checks: { target: string; targetType: string; clean: boolean; listedOn: string | null; checkedAt: Date; autoAction: string | null }[];
  currentlyListed: string[];
}> {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  try {
    const checks = await prisma.blacklistCheck.findMany({
      where: { checkedAt: { gte: since } },
      orderBy: { checkedAt: 'desc' },
      take: 100,
    });

    // Get latest check per target to determine current status
    const latestByTarget = new Map<string, typeof checks[0]>();
    for (const check of checks) {
      if (!latestByTarget.has(check.target)) {
        latestByTarget.set(check.target, check);
      }
    }

    const currentlyListed = [...latestByTarget.entries()]
      .filter(([, check]) => !check.clean)
      .map(([target]) => target);

    return { checks, currentlyListed };
  } catch {
    return { checks: [], currentlyListed: [] };
  }
}

// ── DNS Health Monitoring ──

/**
 * Comprehensive DNS health check for a domain.
 * Checks SPF, DKIM, DMARC, PTR (reverse DNS), and MX records.
 */
export async function checkDnsHealth(domain: string, expectedIp?: string): Promise<{
  domain: string;
  ip: string | null;
  spf: { status: 'pass' | 'fail' | 'missing'; record: string | null; issues: string[] };
  dkim: { status: 'pass' | 'fail' | 'missing'; selector: string; issues: string[] };
  dmarc: { status: 'pass' | 'fail' | 'missing'; record: string | null; policy: string | null; issues: string[] };
  ptr: { status: 'pass' | 'fail' | 'mismatch' | 'missing'; hostname: string | null; issues: string[] };
  mx: { status: 'pass' | 'fail' | 'missing'; records: { exchange: string; priority: number }[]; issues: string[] };
  overall: 'healthy' | 'warning' | 'critical';
  score: number; // 0-100
  issues: string[];
}> {
  const issues: string[] = [];
  let score = 100;

  // ── Resolve domain IP ──
  let ip: string | null = null;
  try {
    const ips = await resolve4(domain);
    ip = ips[0] || null;
  } catch { /* no A record */ }

  // Use mail subdomain if main domain has no A record
  if (!ip) {
    try {
      const ips = await resolve4(`mail.${domain}`);
      ip = ips[0] || null;
    } catch { /* ok */ }
  }

  const targetIp = expectedIp || ip;

  // ── SPF Check ──
  let spfRecord: string | null = null;
  const spfIssues: string[] = [];
  let spfStatus: 'pass' | 'fail' | 'missing' = 'missing';
  try {
    const txt = await resolveTxt(domain);
    const spf = txt.flat().find(r => r.startsWith('v=spf1'));
    if (spf) {
      spfRecord = spf;
      spfStatus = 'pass';

      // Check SPF quality
      if (!spf.includes('-all') && !spf.includes('~all')) {
        spfIssues.push('SPF record should end with "-all" (hard fail) or "~all" (soft fail)');
        score -= 5;
      }
      if (spf.includes('+all')) {
        spfIssues.push('CRITICAL: SPF record allows all senders (+all) — this is insecure');
        spfStatus = 'fail';
        score -= 20;
      }
      // Check for too many DNS lookups (max 10)
      const lookups = (spf.match(/include:|a:|mx:|redirect=/g) || []).length;
      if (lookups > 8) {
        spfIssues.push(`SPF record has ${lookups} DNS lookups (max 10) — risk of permerror`);
        score -= 5;
      }
      // Check if VPS IP is included
      if (targetIp && !spf.includes(targetIp) && !spf.includes('include:')) {
        spfIssues.push(`VPS IP ${targetIp} may not be authorized in SPF record`);
        score -= 10;
      }
    } else {
      spfIssues.push('No SPF record found — ISPs will flag your emails');
      score -= 25;
    }
  } catch {
    spfIssues.push('Could not query SPF record');
    score -= 15;
  }

  // ── DKIM Check ──
  const dkimSelector = 'dkim'; // Common selectors to try
  const dkimSelectors = ['dkim', 'blok', 'mail', 'default', 'google', 'selector1', 'selector2', 'k1'];
  const dkimIssues: string[] = [];
  let dkimStatus: 'pass' | 'fail' | 'missing' = 'missing';
  let foundSelector = dkimSelector;

  for (const sel of dkimSelectors) {
    try {
      const txt = await resolveTxt(`${sel}._domainkey.${domain}`);
      const dkimRecord = txt.flat().join('');
      if (dkimRecord.includes('v=DKIM1') || dkimRecord.includes('p=')) {
        dkimStatus = 'pass';
        foundSelector = sel;
        // Check key length (RSA 2048+ recommended)
        const keyMatch = dkimRecord.match(/p=([A-Za-z0-9+/=]+)/);
        if (keyMatch && keyMatch[1].length < 300) {
          dkimIssues.push('DKIM key appears to be RSA 1024-bit — upgrade to 2048-bit for better security');
          score -= 5;
        }
        break;
      }
    } catch { /* try next selector */ }
  }

  if (dkimStatus === 'missing') {
    dkimIssues.push('No DKIM record found — emails lack cryptographic authentication');
    score -= 25;
  }

  // ── DMARC Check ──
  let dmarcRecord: string | null = null;
  let dmarcPolicy: string | null = null;
  const dmarcIssues: string[] = [];
  let dmarcStatus: 'pass' | 'fail' | 'missing' = 'missing';
  try {
    const txt = await resolveTxt(`_dmarc.${domain}`);
    const dmarc = txt.flat().find(r => r.startsWith('v=DMARC1'));
    if (dmarc) {
      dmarcRecord = dmarc;
      dmarcStatus = 'pass';

      const policyMatch = dmarc.match(/p=(\w+)/);
      dmarcPolicy = policyMatch ? policyMatch[1] : null;

      if (dmarcPolicy === 'none') {
        dmarcIssues.push('DMARC policy is "none" — consider upgrading to "quarantine" or "reject" for better protection');
        score -= 5;
      }
      if (!dmarc.includes('rua=')) {
        dmarcIssues.push('DMARC record has no aggregate report address (rua=) — you won\'t receive deliverability reports');
        score -= 5;
      }
      if (!dmarc.includes('ruf=')) {
        dmarcIssues.push('Consider adding forensic report address (ruf=) for detailed failure reports');
      }
    } else {
      dmarcIssues.push('No DMARC record found — domain lacks policy for handling auth failures');
      score -= 20;
    }
  } catch {
    dmarcIssues.push('Could not query DMARC record');
    score -= 10;
  }

  // ── PTR (Reverse DNS) Check ──
  let ptrHostname: string | null = null;
  const ptrIssues: string[] = [];
  let ptrStatus: 'pass' | 'fail' | 'mismatch' | 'missing' = 'missing';

  if (targetIp) {
    try {
      const ptrs = await resolvePtr(targetIp);
      if (ptrs.length > 0) {
        ptrHostname = ptrs[0];
        // Verify forward/reverse match
        try {
          const forwardIps = await resolve4(ptrHostname);
          if (forwardIps.includes(targetIp)) {
            ptrStatus = 'pass';
          } else {
            ptrStatus = 'mismatch';
            ptrIssues.push(`PTR hostname ${ptrHostname} resolves to ${forwardIps.join(', ')} instead of ${targetIp} — forward/reverse mismatch`);
            score -= 20;
          }
        } catch {
          ptrStatus = 'mismatch';
          ptrIssues.push(`PTR hostname ${ptrHostname} does not resolve — forward DNS missing`);
          score -= 20;
        }

        // Check if PTR looks legitimate (not generic ISP hostname)
        if (ptrHostname.match(/static|ip-|host-|pool-|\d+-\d+-\d+-\d+/i)) {
          ptrIssues.push(`PTR hostname "${ptrHostname}" looks like a generic ISP name — set it to your mail hostname (e.g., mail.${domain})`);
          score -= 10;
        }
      } else {
        ptrIssues.push(`No PTR record for ${targetIp} — ISPs will reject or spam-folder your emails`);
        score -= 30;
      }
    } catch {
      ptrIssues.push(`Could not query PTR record for ${targetIp}`);
      score -= 15;
    }
  } else {
    ptrIssues.push('No IP available to check PTR record');
  }

  // ── MX Records Check ──
  let mxRecords: { exchange: string; priority: number }[] = [];
  const mxIssues: string[] = [];
  let mxStatus: 'pass' | 'fail' | 'missing' = 'missing';
  try {
    const mx = await resolveMx(domain);
    if (mx.length > 0) {
      mxRecords = mx.map(r => ({ exchange: r.exchange, priority: r.priority }));
      mxStatus = 'pass';

      // Check MX resolves
      try {
        await resolve4(mx[0].exchange);
      } catch {
        mxIssues.push(`Primary MX ${mx[0].exchange} does not resolve to an IP`);
        mxStatus = 'fail';
        score -= 10;
      }

      if (mx.length === 1) {
        mxIssues.push('Only one MX record — consider adding a backup MX for redundancy');
      }
    } else {
      mxIssues.push('No MX records — domain cannot receive email (needed for bounce handling)');
      score -= 15;
    }
  } catch {
    mxIssues.push('Could not query MX records');
    score -= 10;
  }

  // Collect all issues
  issues.push(...spfIssues, ...dkimIssues, ...dmarcIssues, ...ptrIssues, ...mxIssues);

  // Determine overall health
  const overall = score >= 80 ? 'healthy' : score >= 50 ? 'warning' : 'critical';

  score = Math.max(0, Math.min(100, score));

  return {
    domain,
    ip: targetIp,
    spf: { status: spfStatus, record: spfRecord, issues: spfIssues },
    dkim: { status: dkimStatus, selector: foundSelector, issues: dkimIssues },
    dmarc: { status: dmarcStatus, record: dmarcRecord, policy: dmarcPolicy, issues: dmarcIssues },
    ptr: { status: ptrStatus, hostname: ptrHostname, issues: ptrIssues },
    mx: { status: mxStatus, records: mxRecords, issues: mxIssues },
    overall,
    score,
    issues,
  };
}

/**
 * Run DNS health check and save results to DB.
 */
export async function runDnsHealthMonitor(): Promise<{
  results: { domain: string; overall: string; score: number; issues: string[] }[];
}> {
  const results: { domain: string; overall: string; score: number; issues: string[] }[] = [];
  const vpsIp = process.env.VPS_IP || process.env.MAILCOW_IP;

  try {
    // Get all sending domains
    const accounts = await prisma.sendingAccount.findMany({
      where: { active: true },
      select: { email: true },
    });

    const domains = [...new Set(accounts.map(a => a.email.split('@')[1]).filter(Boolean))];

    // Also check configured domains from Domain model
    const configuredDomains = await prisma.domain.findMany({
      select: { name: true },
    });
    for (const d of configuredDomains) {
      if (!domains.includes(d.name)) domains.push(d.name);
    }

    for (const domain of domains) {
      const health = await checkDnsHealth(domain, vpsIp || undefined);

      try {
        await prisma.dnsHealthCheck.create({
          data: {
            domain,
            ip: health.ip,
            spfStatus: health.spf.status,
            dkimStatus: health.dkim.status,
            dmarcStatus: health.dmarc.status,
            ptrStatus: health.ptr.status,
            ptrHostname: health.ptr.hostname,
            mxStatus: health.mx.status,
            mxRecords: JSON.stringify(health.mx.records),
            overall: health.overall,
            details: JSON.stringify({
              spf: health.spf,
              dkim: health.dkim,
              dmarc: health.dmarc,
              ptr: health.ptr,
              mx: health.mx,
            }),
          },
        });
      } catch { /* table may not exist */ }

      results.push({
        domain,
        overall: health.overall,
        score: health.score,
        issues: health.issues,
      });
    }
  } catch (err) {
    console.error('[DNS Health] Monitor error:', err);
  }

  return { results };
}

// ── List Hygiene ──

/**
 * Automated list hygiene — sunset disengaged leads, purge hard bounces.
 * Called by daily cron.
 */
export async function runListHygiene(): Promise<{
  sunsetted: number;
  purgedInvalid: number;
  purgedBounced: number;
  purgedComplaints: number;
  totalCleaned: number;
  details: string;
}> {
  const today = new Date().toISOString().slice(0, 10);
  let sunsetted = 0;
  let purgedInvalid = 0;
  let purgedBounced = 0;
  let purgedComplaints = 0;

  // 1. Sunset disengaged leads (90+ days no engagement, 5+ emails sent)
  //    → mark as unsubscribed to prevent future sends
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  try {
    const disengaged = await prisma.lead.findMany({
      where: {
        unsubscribed: false,
        emailsSent: { gte: 5 },
        lastEngagedAt: { lt: ninetyDaysAgo },
        complainedAt: null,
      },
      select: { id: true },
    });

    if (disengaged.length > 0) {
      await prisma.lead.updateMany({
        where: { id: { in: disengaged.map(l => l.id) } },
        data: { unsubscribed: true },
      });
      sunsetted = disengaged.length;
    }
  } catch { /* ok */ }

  // 2. Purge leads with invalid/disposable emails (hard suppress)
  try {
    const invalid = await prisma.lead.findMany({
      where: {
        unsubscribed: false,
        verifyResult: { in: ['invalid', 'disposable'] },
      },
      select: { id: true },
    });

    if (invalid.length > 0) {
      await prisma.lead.updateMany({
        where: { id: { in: invalid.map(l => l.id) } },
        data: { unsubscribed: true },
      });
      purgedInvalid = invalid.length;
    }
  } catch { /* ok */ }

  // 3. Purge hard-bounced leads (3+ bounces or bounceType=hard)
  try {
    const bounced = await prisma.lead.findMany({
      where: {
        unsubscribed: false,
        OR: [
          { bounceType: 'hard' },
          { bounceCount: { gte: 3 } },
        ],
      },
      select: { id: true },
    });

    if (bounced.length > 0) {
      await prisma.lead.updateMany({
        where: { id: { in: bounced.map(l => l.id) } },
        data: { unsubscribed: true },
      });
      purgedBounced = bounced.length;
    }
  } catch { /* ok */ }

  // 4. Ensure complained leads stay unsubscribed
  try {
    const complained = await prisma.lead.updateMany({
      where: {
        complainedAt: { not: null },
        unsubscribed: false,
      },
      data: { unsubscribed: true },
    });
    purgedComplaints = complained.count;
  } catch { /* ok */ }

  const totalCleaned = sunsetted + purgedInvalid + purgedBounced + purgedComplaints;
  const details = JSON.stringify({
    sunsetted,
    purgedInvalid,
    purgedBounced,
    purgedComplaints,
  });

  // Log the hygiene run
  if (totalCleaned > 0) {
    try {
      await prisma.listHygieneLog.upsert({
        where: { date: today },
        update: { leadsAffected: totalCleaned, details, action: 'auto_clean' },
        create: { date: today, action: 'auto_clean', leadsAffected: totalCleaned, details },
      });
    } catch { /* table may not exist */ }
  }

  return { sunsetted, purgedInvalid, purgedBounced, purgedComplaints, totalCleaned, details };
}

// ── Content Spam Score (Enhanced) ──

const SPAM_TRIGGERS = [
  // Urgency (high weight — ISPs hate these)
  { pattern: /act now/i, weight: 3, category: 'urgency', fix: 'Remove "act now" — suggests scam' },
  { pattern: /limited time/i, weight: 3, category: 'urgency', fix: 'Rephrase without time pressure' },
  { pattern: /hurry/i, weight: 2, category: 'urgency', fix: 'Avoid urgency language' },
  { pattern: /don't miss/i, weight: 2, category: 'urgency', fix: 'Rephrase without FOMO' },
  { pattern: /expires?\b/i, weight: 2, category: 'urgency', fix: 'Be specific about timelines instead' },
  { pattern: /urgent/i, weight: 3, category: 'urgency', fix: 'Remove urgency claim' },
  { pattern: /last chance/i, weight: 3, category: 'urgency', fix: 'Remove "last chance"' },
  { pattern: /immediately/i, weight: 2, category: 'urgency', fix: 'Avoid "immediately"' },
  // Money triggers
  { pattern: /free\b/i, weight: 2, category: 'money', fix: 'Replace "free" with "complimentary" or "no-cost"' },
  { pattern: /\$\d+/i, weight: 2, category: 'money', fix: 'Avoid dollar amounts in email body' },
  { pattern: /discount/i, weight: 2, category: 'money', fix: 'Use "savings" or "special pricing" instead' },
  { pattern: /cheap/i, weight: 3, category: 'money', fix: 'Replace "cheap" with "affordable"' },
  { pattern: /earn money/i, weight: 4, category: 'money', fix: 'Critical spam trigger — remove' },
  { pattern: /cash bonus/i, weight: 4, category: 'money', fix: 'Critical spam trigger — remove' },
  { pattern: /no cost/i, weight: 3, category: 'money', fix: 'Use "complimentary" instead' },
  { pattern: /double your/i, weight: 4, category: 'money', fix: 'Remove get-rich-quick language' },
  { pattern: /million dollars/i, weight: 5, category: 'money', fix: 'Remove — classic spam indicator' },
  { pattern: /100% free/i, weight: 4, category: 'money', fix: 'Remove "100% free"' },
  // Shady / sales
  { pattern: /click (here|below)/i, weight: 2, category: 'shady', fix: 'Use descriptive link text instead of "click here"' },
  { pattern: /buy now/i, weight: 3, category: 'shady', fix: 'Replace with a softer CTA' },
  { pattern: /order now/i, weight: 3, category: 'shady', fix: 'Use "learn more" or "get started"' },
  { pattern: /sign up free/i, weight: 2, category: 'shady', fix: 'Rephrase registration language' },
  { pattern: /no obligation/i, weight: 2, category: 'shady', fix: 'Remove sales pressure language' },
  { pattern: /risk[- ]free/i, weight: 2, category: 'shady', fix: 'Remove "risk-free"' },
  { pattern: /guaranteed/i, weight: 2, category: 'shady', fix: 'Avoid guarantees — reduces trust' },
  { pattern: /winner/i, weight: 3, category: 'shady', fix: 'Remove "winner" — scam trigger' },
  { pattern: /congratulations/i, weight: 3, category: 'shady', fix: 'Remove — classic phishing trigger' },
  { pattern: /as seen on/i, weight: 2, category: 'shady', fix: 'Remove "as seen on"' },
  { pattern: /unsubscribe/i, weight: -1, category: 'good', fix: '' }, // Having unsubscribe is good
  // Formatting issues
  { pattern: /[A-Z]{5,}/g, weight: 2, category: 'formatting', fix: 'Avoid ALL CAPS words — use normal case' },
  { pattern: /!{2,}/g, weight: 2, category: 'formatting', fix: 'Use only single exclamation marks' },
  { pattern: /\${2,}/g, weight: 3, category: 'formatting', fix: 'Remove multiple dollar signs' },
  // Technical red flags
  { pattern: /<script/i, weight: 10, category: 'technical', fix: 'CRITICAL: Remove JavaScript — instant spam filter' },
  { pattern: /display\s*:\s*none/i, weight: 3, category: 'technical', fix: 'Remove hidden content — spam filter red flag' },
  { pattern: /font-size\s*:\s*[01]px/i, weight: 3, category: 'technical', fix: 'Remove invisible text — spam filter red flag' },
  { pattern: /position\s*:\s*absolute.*-\d+px/i, weight: 3, category: 'technical', fix: 'Remove offscreen positioned elements' },
];

/**
 * Enhanced spam score analysis with actionable fixes.
 */
export function analyzeSpamScore(subject: string, body: string): {
  score: number;
  rating: 'clean' | 'low_risk' | 'medium_risk' | 'high_risk' | 'spam';
  issues: { trigger: string; category: string; weight: number; fix: string }[];
  recommendations: string[];
  htmlQuality: { ratio: number; imageCount: number; linkCount: number; hasPlainText: boolean; issues: string[] };
} {
  const combined = `${subject || ''} ${body || ''}`;
  const issues: { trigger: string; category: string; weight: number; fix: string }[] = [];
  let totalWeight = 0;

  for (const trigger of SPAM_TRIGGERS) {
    const matches = combined.match(trigger.pattern);
    if (matches && trigger.weight > 0) {
      issues.push({ trigger: matches[0], category: trigger.category, weight: trigger.weight, fix: trigger.fix });
      totalWeight += trigger.weight;
    }
  }

  // ── HTML Quality Analysis ──
  const htmlIssues: string[] = [];
  const imageCount = (body?.match(/<img\b/gi) || []).length;
  const linkCount = (body?.match(/href="/gi) || []).length;
  const textLength = (body?.replace(/<[^>]+>/g, '') || '').length;
  const htmlLength = (body || '').length;
  const ratio = htmlLength > 0 ? textLength / htmlLength : 0;

  if (ratio < 0.3 && htmlLength > 200) {
    htmlIssues.push('Low text-to-HTML ratio — add more text content');
    totalWeight += 3;
  }
  if (imageCount > 3) {
    htmlIssues.push(`${imageCount} images — too many images triggers spam filters`);
    totalWeight += 2;
  }
  if (imageCount > 0 && textLength < 100) {
    htmlIssues.push('Image-heavy with little text — add text content alongside images');
    totalWeight += 3;
  }
  if (linkCount > 5) {
    htmlIssues.push(`${linkCount} links — reduce to 3 or fewer for better deliverability`);
    totalWeight += 2;
  }

  // Subject line checks
  if (subject && subject === subject.toUpperCase() && subject.length > 5) {
    issues.push({ trigger: 'ALL CAPS subject', category: 'formatting', weight: 4, fix: 'Use normal case for subject line' });
    totalWeight += 4;
  }
  if (subject && subject.length > 60) {
    issues.push({ trigger: `Subject too long (${subject.length} chars)`, category: 'formatting', weight: 1, fix: 'Keep subject under 50 characters for mobile' });
    totalWeight += 1;
  }
  if (subject && /^(Re:|Fwd:)/i.test(subject) && !subject.includes('{{')) {
    issues.push({ trigger: 'Fake Re:/Fwd: prefix', category: 'shady', weight: 3, fix: 'Remove fake reply/forward prefix — ISPs detect this' });
    totalWeight += 3;
  }

  // Link-to-text ratio
  const wordCount = combined.split(/\s+/).length;
  const urlCount = (combined.match(/https?:\/\//g) || []).length;
  const linkRatio = wordCount > 0 ? urlCount / wordCount : 0;
  if (linkRatio > 0.1) {
    issues.push({ trigger: `High link ratio: ${(linkRatio * 100).toFixed(0)}%`, category: 'links', weight: 3, fix: 'Add more text content relative to links' });
    totalWeight += 3;
  }

  // Personalization check (positive)
  const hasPersonalization = combined.includes('{{name}}') || combined.includes('{{field}}');
  if (!hasPersonalization) {
    issues.push({ trigger: 'No personalization', category: 'content', weight: 2, fix: 'Add {{name}} or {{field}} merge tags — personalized emails get 26% higher open rates' });
    totalWeight += 2;
  }

  // Score: 0-100 (0 = clean, 100 = very spammy)
  const score = Math.min(100, Math.round(totalWeight * 4));
  const rating = score <= 15 ? 'clean' : score <= 35 ? 'low_risk' : score <= 55 ? 'medium_risk' : score <= 75 ? 'high_risk' : 'spam';

  // Generate recommendations
  const recommendations: string[] = [];
  if (score > 30) recommendations.push('Consider rewriting subject/body to reduce spam triggers');
  if (!hasPersonalization) recommendations.push('Add personalization with {{name}} merge tags');
  if (htmlIssues.length > 0) recommendations.push('Improve HTML quality — ISPs analyze code-to-text ratio');
  if (issues.some(i => i.category === 'urgency')) recommendations.push('Remove urgency language — it\'s the #1 spam trigger');
  if (score <= 15) recommendations.push('Your content looks clean — good to send!');

  return {
    score,
    rating,
    issues,
    recommendations,
    htmlQuality: {
      ratio: Math.round(ratio * 100),
      imageCount,
      linkCount,
      hasPlainText: textLength > 100,
      issues: htmlIssues,
    },
  };
}

// ── Utility ──

async function resolveIPForDomain(domain: string): Promise<string | null> {
  try {
    const mx = await resolveMx(domain);
    if (mx.length > 0) {
      const ips = await resolve4(mx[0].exchange);
      return ips[0] || null;
    }
    const ips = await resolve4(domain);
    return ips[0] || null;
  } catch {
    return null;
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { fullBlacklistScan, getBlacklistHistory, checkDnsHealth } from '@/lib/blacklist-monitor';

/**
 * POST /api/admin/blacklist — comprehensive blacklist + DNS health check
 *
 * Enhanced with:
 * - 15+ IP blacklists (was 8)
 * - 4 domain blacklists (was 3)
 * - Severity classifications (critical/high/medium)
 * - Blacklist score (0-100)
 * - DNS health check option
 * - Blacklist history retrieval
 */
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { domain, ip: directIp, action } = await req.json();

    // Get blacklist history
    if (action === 'history') {
      const history = await getBlacklistHistory(30);
      return NextResponse.json(history);
    }

    // DNS health check
    if (action === 'dns-health') {
      if (!domain) {
        return NextResponse.json({ error: 'Provide a domain for DNS health check' }, { status: 400 });
      }
      const health = await checkDnsHealth(domain, directIp || undefined);
      return NextResponse.json(health);
    }

    // Standard blacklist check
    if (!domain && !directIp) {
      return NextResponse.json({ error: 'Provide a domain or ip' }, { status: 400 });
    }

    const ip = directIp || null;
    const scan = await fullBlacklistScan(ip || '0.0.0.0', domain || undefined);

    // Build listedOn array from scan results (matches dashboard expected shape)
    const allResults = [...scan.ipResults, ...scan.domainResults];
    const listedOn = allResults
      .filter(r => r.listed)
      .map(r => ({
        blacklist: r.blacklist,
        type: r.severity,
      }));
    const totalChecked = allResults.length;

    return NextResponse.json({
      domain: domain || null,
      ip: scan.ip,
      clean: scan.clean,
      score: scan.score,
      listedCount: scan.listedCount,
      listedOn,
      totalChecked,
      criticalListings: scan.criticalListings,
      highListings: scan.highListings,
      ipResults: scan.ipResults,
      domainResults: scan.domainResults,
      checkedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error('[Blacklist] Check error:', err);
    return NextResponse.json({ error: 'Blacklist check failed' }, { status: 500 });
  }
}

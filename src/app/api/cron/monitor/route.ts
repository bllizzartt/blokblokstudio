import { NextRequest, NextResponse } from 'next/server';
import {
  runBlacklistMonitor,
  runDnsHealthMonitor,
  runListHygiene,
} from '@/lib/blacklist-monitor';
import { recordDailySnapshot } from '@/lib/deliverability';

/**
 * Cron job — runs daily (recommended: 6am UTC, before send-campaigns at 8am).
 *
 * Pre-flight checks before any emails go out:
 * 1. Blacklist scan — checks VPS IP + sending domains against 15+ DNSBLs
 *    → Auto-pauses all sending if listed on Spamhaus/SpamCop (critical)
 * 2. DNS health — verifies SPF/DKIM/DMARC/PTR/MX for all sending domains
 * 3. List hygiene — sunsets disengaged leads, purges invalid/bounced
 * 4. Deliverability snapshot — records daily metrics
 *
 * This runs BEFORE the send-campaigns cron to catch problems early.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, unknown> = {};
  const startTime = Date.now();

  // ── 1. Blacklist Scan ──
  try {
    const blacklistResult = await runBlacklistMonitor();
    results.blacklist = {
      allClear: blacklistResult.allClear,
      checksRun: blacklistResult.checks.length,
      actionsTaken: blacklistResult.actionsTaken,
      details: blacklistResult.checks.map(c => ({
        target: c.target,
        type: c.targetType,
        clean: c.clean,
        listedOn: c.listedOn,
        action: c.action,
      })),
    };

    // If sending was auto-paused, stop here — no point running other checks
    if (blacklistResult.actionsTaken.some(a => a.includes('Paused all sending'))) {
      return NextResponse.json({
        message: '🚨 SENDING PAUSED — Blacklist detected',
        duration: `${Date.now() - startTime}ms`,
        results,
      });
    }
  } catch (err) {
    console.error('[Monitor] Blacklist scan error:', err);
    results.blacklist = { error: 'Scan failed' };
  }

  // ── 2. DNS Health Check ──
  try {
    const dnsResult = await runDnsHealthMonitor();
    results.dns = {
      domainsChecked: dnsResult.results.length,
      results: dnsResult.results.map(r => ({
        domain: r.domain,
        overall: r.overall,
        score: r.score,
        issueCount: r.issues.length,
      })),
    };
  } catch (err) {
    console.error('[Monitor] DNS health error:', err);
    results.dns = { error: 'Check failed' };
  }

  // ── 3. List Hygiene ──
  try {
    const hygieneResult = await runListHygiene();
    results.hygiene = {
      totalCleaned: hygieneResult.totalCleaned,
      sunsetted: hygieneResult.sunsetted,
      purgedInvalid: hygieneResult.purgedInvalid,
      purgedBounced: hygieneResult.purgedBounced,
      purgedComplaints: hygieneResult.purgedComplaints,
    };
  } catch (err) {
    console.error('[Monitor] List hygiene error:', err);
    results.hygiene = { error: 'Clean failed' };
  }

  // ── 4. Deliverability Snapshot ──
  try {
    await recordDailySnapshot();
    results.snapshot = { recorded: true };
  } catch (err) {
    console.error('[Monitor] Snapshot error:', err);
    results.snapshot = { error: 'Failed' };
  }

  return NextResponse.json({
    message: 'Daily monitor complete',
    duration: `${Date.now() - startTime}ms`,
    results,
  });
}

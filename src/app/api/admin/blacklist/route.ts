import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import dns from 'dns';
import { promisify } from 'util';

const resolve4 = promisify(dns.resolve4);
const resolveMx = promisify(dns.resolveMx);

// Common DNS blacklists
const BLACKLISTS = [
  'zen.spamhaus.org',
  'bl.spamcop.net',
  'b.barracudacentral.org',
  'dnsbl.sorbs.net',
  'spam.dnsbl.sorbs.net',
  'dnsbl-1.uceprotect.net',
  'psbl.surriel.com',
  'all.s5h.net',
];

// Domain blacklists
const DOMAIN_BLACKLISTS = [
  'dbl.spamhaus.org',
  'multi.surbl.org',
  'black.uribl.com',
];

async function checkBlacklist(ip: string, bl: string): Promise<boolean> {
  const reversed = ip.split('.').reverse().join('.');
  try {
    await resolve4(`${reversed}.${bl}`);
    return true; // Listed
  } catch {
    return false; // Not listed
  }
}

async function checkDomainBlacklist(domain: string, bl: string): Promise<boolean> {
  try {
    await resolve4(`${domain}.${bl}`);
    return true;
  } catch {
    return false;
  }
}

async function getIPForDomain(domain: string): Promise<string | null> {
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

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { domain } = await req.json();
    if (!domain) {
      return NextResponse.json({ error: 'Provide a domain' }, { status: 400 });
    }

    const ip = await getIPForDomain(domain);
    const results: { blacklist: string; listed: boolean; type: string }[] = [];

    // Check IP blacklists
    if (ip) {
      const ipChecks = await Promise.allSettled(
        BLACKLISTS.map(async bl => ({
          blacklist: bl,
          listed: await checkBlacklist(ip, bl),
          type: 'ip',
        }))
      );
      for (const check of ipChecks) {
        if (check.status === 'fulfilled') results.push(check.value);
      }
    }

    // Check domain blacklists
    const domainChecks = await Promise.allSettled(
      DOMAIN_BLACKLISTS.map(async bl => ({
        blacklist: bl,
        listed: await checkDomainBlacklist(domain, bl),
        type: 'domain',
      }))
    );
    for (const check of domainChecks) {
      if (check.status === 'fulfilled') results.push(check.value);
    }

    const listedOn = results.filter(r => r.listed);

    return NextResponse.json({
      domain,
      ip: ip || 'unknown',
      clean: listedOn.length === 0,
      listedOn,
      totalChecked: results.length,
      results,
    });
  } catch {
    return NextResponse.json({ error: 'Blacklist check failed' }, { status: 500 });
  }
}

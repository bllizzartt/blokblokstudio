import { NextRequest, NextResponse } from 'next/server';
import dns from 'dns';
import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';
import { encrypt } from '@/lib/crypto';

// ── DNS Lookup Helpers ──
function resolveTxt(domain: string): Promise<string[][]> {
  return new Promise((resolve) => {
    dns.resolveTxt(domain, (err, records) => resolve(err ? [] : records));
  });
}

function resolveMx(domain: string): Promise<dns.MxRecord[]> {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, records) => resolve(err ? [] : records));
  });
}

function resolveCname(domain: string): Promise<string[]> {
  return new Promise((resolve) => {
    dns.resolveCname(domain, (err, records) => resolve(err ? [] : records));
  });
}

// ── DNS Health Check ──
async function checkDomainDNS(domainName: string, dkimSelector: string) {
  const results: Record<string, { status: string; found: string; expected?: string }> = {};

  // Check SPF
  const txtRecords = await resolveTxt(domainName);
  const allTxt = txtRecords.flat();
  const spfRecord = allTxt.find(r => r.startsWith('v=spf1'));
  results.spf = spfRecord
    ? { status: 'pass', found: spfRecord }
    : { status: 'fail', found: 'Not found', expected: 'v=spf1 include:_spf.google.com ~all' };

  // Check DKIM
  const dkimDomain = `${dkimSelector}._domainkey.${domainName}`;
  const dkimRecords = await resolveTxt(dkimDomain);
  const dkimTxt = dkimRecords.flat().join('');
  results.dkim = dkimTxt.includes('v=DKIM1')
    ? { status: 'pass', found: dkimTxt.slice(0, 100) + '...' }
    : { status: 'fail', found: 'Not found', expected: `Add TXT record at ${dkimDomain}` };

  // Check DMARC
  const dmarcRecords = await resolveTxt(`_dmarc.${domainName}`);
  const dmarcTxt = dmarcRecords.flat().find(r => r.startsWith('v=DMARC1'));
  results.dmarc = dmarcTxt
    ? { status: 'pass', found: dmarcTxt }
    : { status: 'fail', found: 'Not found', expected: 'v=DMARC1; p=none; rua=mailto:dmarc@' + domainName };

  // Check MX
  const mxRecords = await resolveMx(domainName);
  results.mx = mxRecords.length > 0
    ? { status: 'pass', found: mxRecords.map(r => `${r.priority} ${r.exchange}`).join(', ') }
    : { status: 'fail', found: 'No MX records' };

  const allPass = Object.values(results).every(r => r.status === 'pass');

  return { results, allPass };
}

// ── Generate recommended DNS records ──
// VPS IP and mail hostname from env, with Hetzner/Mailcow defaults
const VPS_IP = process.env.VPS_IP || process.env.MAILCOW_IP || '46.225.131.150';
const MAIL_HOSTNAME = process.env.MAILCOW_HOST || 'mail.blokblokstudio.com';

function generateDNSRecords(domainName: string, dkimSelector: string, dkimPublicKey?: string) {
  return {
    a_mail: {
      type: 'A',
      host: 'mail',
      value: VPS_IP,
      description: `Points mail.${domainName} to your Mailcow VPS — required for email delivery`,
    },
    mx: {
      type: 'MX',
      host: '@',
      value: `10 ${MAIL_HOSTNAME}`,
      description: 'Routes incoming email (bounces & replies) to your Mailcow server',
    },
    spf: {
      type: 'TXT',
      host: '@',
      value: `v=spf1 ip4:${VPS_IP} -all`,
      description: `Authorizes your VPS (${VPS_IP}) as the only server allowed to send email for this domain`,
    },
    dkim: {
      type: 'TXT',
      host: `${dkimSelector}._domainkey`,
      value: dkimPublicKey
        ? `v=DKIM1; k=rsa; p=${dkimPublicKey}`
        : 'Generate DKIM keys first',
      description: 'Cryptographically signs your emails to prove authenticity',
    },
    dmarc: {
      type: 'TXT',
      host: '_dmarc',
      value: `v=DMARC1; p=quarantine; rua=mailto:dmarc@${domainName}; pct=100`,
      description: 'Tells receiving servers to quarantine emails that fail SPF/DKIM — protects your reputation',
    },
  };
}

// GET /api/admin/domains — list all domains with DNS status
export async function GET(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const domains = await prisma.domain.findMany({ orderBy: { createdAt: 'desc' } });
    return NextResponse.json({ domains });
  } catch {
    return NextResponse.json({ domains: [] });
  }
}

// POST /api/admin/domains — create domain, check DNS, or generate DKIM keys
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { action, domainId, name, dkimSelector } = await req.json();

    // Create new domain
    if (action === 'create' || !action) {
      if (!name || typeof name !== 'string') {
        return NextResponse.json({ error: 'Domain name required' }, { status: 400 });
      }

      const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9.\-]/g, '');
      if (!cleanName.includes('.')) {
        return NextResponse.json({ error: 'Invalid domain name' }, { status: 400 });
      }

      const domain = await prisma.domain.create({
        data: {
          name: cleanName,
          dkimSelector: dkimSelector || 'blok',
        },
      });

      // Auto-check DNS on creation so user immediately sees what's missing
      const records = generateDNSRecords(cleanName, domain.dkimSelector);
      const check = await checkDomainDNS(cleanName, domain.dkimSelector);

      // Build warnings for missing critical records
      const dnsWarnings: string[] = [];
      if (check.results.mx?.status !== 'pass') {
        dnsWarnings.push(`MX record missing — add: ${records.mx.value}`);
      }
      if (check.results.spf?.status !== 'pass') {
        dnsWarnings.push(`SPF record missing — add TXT: ${records.spf.value}`);
      }
      if (check.results.dkim?.status !== 'pass') {
        dnsWarnings.push('DKIM not set up — generate DKIM keys and add the TXT record');
      }
      if (check.results.dmarc?.status !== 'pass') {
        dnsWarnings.push(`DMARC record missing — add TXT at _dmarc: ${records.dmarc.value}`);
      }

      // Check if mail.{domain} A record exists
      let mailARecord = false;
      try {
        const resolve4 = (await import('util')).promisify(dns.resolve4);
        const ips = await resolve4(`mail.${cleanName}`);
        mailARecord = ips.length > 0;
      } catch { /* no A record */ }
      if (!mailARecord) {
        dnsWarnings.push(`A record missing for mail.${cleanName} — point it to ${VPS_IP}`);
      }

      return NextResponse.json({
        success: true,
        domain,
        records,
        dnsCheck: check,
        dnsWarnings: dnsWarnings.length > 0 ? dnsWarnings : null,
        dnsReady: dnsWarnings.length === 0,
      });
    }

    // Check DNS records
    if (action === 'check') {
      if (!domainId) return NextResponse.json({ error: 'domainId required' }, { status: 400 });

      const domain = await prisma.domain.findUnique({ where: { id: domainId } });
      if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

      const check = await checkDomainDNS(domain.name, domain.dkimSelector);

      await prisma.domain.update({
        where: { id: domainId },
        data: {
          verified: check.allPass,
          lastCheckAt: new Date(),
          lastCheckResult: JSON.stringify(check.results),
        },
      });

      return NextResponse.json({ success: true, ...check });
    }

    // Generate DKIM keys
    if (action === 'generateDKIM') {
      if (!domainId) return NextResponse.json({ error: 'domainId required' }, { status: 400 });

      const domain = await prisma.domain.findUnique({ where: { id: domainId } });
      if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

      // Generate 2048-bit RSA keypair for DKIM
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
      });

      // Extract just the base64 portion (no PEM headers)
      const pubKeyBase64 = publicKey
        .replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '')
        .replace(/\n/g, '');

      await prisma.domain.update({
        where: { id: domainId },
        data: {
          dkimPublicKey: pubKeyBase64,
          dkimPrivateKey: encrypt(privateKey), // Encrypted at rest
        },
      });

      const records = generateDNSRecords(domain.name, domain.dkimSelector, pubKeyBase64);
      return NextResponse.json({ success: true, dkimRecord: records.dkim, publicKey: pubKeyBase64 });
    }

    // Get DNS records to configure
    if (action === 'getRecords') {
      if (!domainId) return NextResponse.json({ error: 'domainId required' }, { status: 400 });
      const domain = await prisma.domain.findUnique({ where: { id: domainId } });
      if (!domain) return NextResponse.json({ error: 'Domain not found' }, { status: 404 });

      const records = generateDNSRecords(domain.name, domain.dkimSelector, domain.dkimPublicKey || undefined);
      return NextResponse.json({ success: true, records });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    const msg = errMsg.includes('Unique') ? 'Domain already exists' : `Error: ${errMsg.slice(0, 200)}`;
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

// DELETE /api/admin/domains?id=xxx
export async function DELETE(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await prisma.domain.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
  }
}

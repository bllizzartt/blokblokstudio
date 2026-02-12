import dns from 'dns';
import net from 'net';
import os from 'os';
import { prisma } from './prisma';

const DISPOSABLE_DOMAINS = new Set([
  'tempmail.com','throwaway.email','guerrillamail.com','mailinator.com','trashmail.com',
  'yopmail.com','10minutemail.com','temp-mail.org','fakeinbox.com','sharklasers.com',
  'guerrillamailblock.com','grr.la','dispostable.com','mailnesia.com','maildrop.cc',
  'discard.email','33mail.com','getnada.com','mohmal.com','emailondeck.com',
  'tempail.com','tempr.email','tmail.io','burnermail.io','inboxkitten.com',
  'mailsac.com','anonbox.net','mintemail.com','tempmailaddress.com','tmpmail.net',
  'tempinbox.com','emailfake.com','crazymailing.com','armyspy.com','dayrep.com',
  'einrot.com','fleckens.hu','gustr.com','jourrapide.com','rhyta.com','superrito.com',
  'teleworm.us','mailcatch.com','trashmail.me','mytrashmail.com','mt2015.com',
]);

// Known catch-all domains (accept all addresses — can't verify individual mailboxes)
const KNOWN_CATCH_ALL = new Set([
  'yahoo.com', 'yahoo.co.uk', 'ymail.com', 'rocketmail.com',
]);

// Domains that block SMTP RCPT TO verification — skip SMTP check, mark as risky
const SMTP_BLOCKED_PROVIDERS = new Set([
  'gmail.com', 'googlemail.com',
  'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'outlook.co.uk',
  'icloud.com', 'me.com', 'mac.com',
  'aol.com',
  'protonmail.com', 'proton.me', 'pm.me',
  'zoho.com', 'zohomail.com',
  'fastmail.com',
  'tutanota.com', 'tuta.com',
]);

export type VerifyResult = 'valid' | 'invalid' | 'risky' | 'catch_all' | 'disposable' | 'unknown';

export interface VerificationResult {
  email: string;
  result: VerifyResult;
  details: {
    syntax: boolean;
    mxExists: boolean;
    disposable: boolean;
    catchAll: boolean;
    roleAccount: boolean;
    smtpCheck: 'passed' | 'failed' | 'skipped' | 'greylisted' | 'blocked';
    smtpResponse?: string;
  };
  reason: string;
}

function isValidSyntax(email: string): boolean {
  const re = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
}

async function checkMX(domain: string): Promise<{ exists: boolean; records: dns.MxRecord[] }> {
  return new Promise((resolve) => {
    dns.resolveMx(domain, (err, records) => {
      if (err || !records || records.length === 0) {
        resolve({ exists: false, records: [] });
      } else {
        resolve({ exists: true, records: records.sort((a, b) => a.priority - b.priority) });
      }
    });
  });
}

function isDisposable(domain: string): boolean {
  return DISPOSABLE_DOMAINS.has(domain.toLowerCase());
}

function isRoleAccount(local: string): boolean {
  const roles = [
    'admin', 'info', 'support', 'contact', 'sales', 'hello', 'help',
    'billing', 'security', 'abuse', 'postmaster', 'webmaster', 'noreply',
    'no-reply', 'office', 'team', 'hr', 'marketing', 'feedback',
  ];
  return roles.includes(local.toLowerCase());
}

/**
 * SMTP handshake verification — connects to the MX server and checks
 * if the mailbox exists using RCPT TO command.
 *
 * Flow: connect → read banner → EHLO → MAIL FROM → RCPT TO → QUIT
 *
 * Response codes:
 *   250 = mailbox exists (valid)
 *   550/551/552/553 = mailbox doesn't exist (invalid)
 *   450/451/452 = greylisting / temp reject (risky but may exist)
 *   421 = server busy / rate limited
 */
async function smtpVerify(
  email: string,
  mxHost: string,
): Promise<{ status: 'passed' | 'failed' | 'greylisted' | 'blocked'; code: number; response: string }> {
  const TIMEOUT = 10000; // 10s per connection
  const hostname = os.hostname() || 'verify.local';

  return new Promise((resolve) => {
    let resolved = false;
    let fullResponse = '';
    let step: 'banner' | 'ehlo' | 'mailfrom' | 'rcptto' | 'quit' = 'banner';

    const done = (status: 'passed' | 'failed' | 'greylisted' | 'blocked', code: number, response: string) => {
      if (resolved) return;
      resolved = true;
      try { socket.destroy(); } catch { /* ignore */ }
      resolve({ status, code, response });
    };

    const timer = setTimeout(() => {
      done('blocked', 0, 'Connection timed out');
    }, TIMEOUT);

    const socket = net.createConnection({ host: mxHost, port: 25, timeout: TIMEOUT });

    socket.setEncoding('utf-8');

    socket.on('error', () => {
      clearTimeout(timer);
      done('blocked', 0, 'Connection error');
    });

    socket.on('timeout', () => {
      clearTimeout(timer);
      done('blocked', 0, 'Socket timeout');
    });

    socket.on('data', (data: string) => {
      fullResponse += data;
      const lines = data.split('\r\n').filter(Boolean);
      // Wait for complete response (line not starting with "xxx-")
      const lastLine = lines[lines.length - 1];
      if (!lastLine) return;
      const code = parseInt(lastLine.substring(0, 3), 10);
      // Multi-line responses have "xxx-" prefix; wait for final "xxx " line
      if (lastLine.length > 3 && lastLine[3] === '-') return;

      if (isNaN(code)) return;

      switch (step) {
        case 'banner':
          if (code === 220) {
            step = 'ehlo';
            socket.write(`EHLO ${hostname}\r\n`);
          } else {
            clearTimeout(timer);
            done('blocked', code, lastLine);
          }
          break;

        case 'ehlo':
          if (code === 250) {
            step = 'mailfrom';
            socket.write(`MAIL FROM:<verify@${hostname}>\r\n`);
          } else {
            clearTimeout(timer);
            done('blocked', code, lastLine);
          }
          break;

        case 'mailfrom':
          if (code === 250) {
            step = 'rcptto';
            socket.write(`RCPT TO:<${email}>\r\n`);
          } else {
            clearTimeout(timer);
            done('blocked', code, lastLine);
          }
          break;

        case 'rcptto': {
          step = 'quit';
          socket.write('QUIT\r\n');
          clearTimeout(timer);

          if (code === 250 || code === 251) {
            done('passed', code, lastLine);
          } else if (code >= 550 && code <= 559) {
            // 550 = "mailbox not found", 551 = "user not local", 553 = "mailbox name not allowed"
            done('failed', code, lastLine);
          } else if (code >= 450 && code <= 459) {
            // 450/451/452 = greylisting or temp error — mailbox may exist
            done('greylisted', code, lastLine);
          } else if (code === 421) {
            done('blocked', code, lastLine);
          } else if (code >= 500) {
            done('failed', code, lastLine);
          } else {
            done('greylisted', code, lastLine);
          }
          break;
        }

        case 'quit':
          // Already resolved
          break;
      }
    });

    socket.on('close', () => {
      clearTimeout(timer);
      if (!resolved) {
        done('blocked', 0, 'Connection closed unexpectedly');
      }
    });
  });
}

/**
 * Detect catch-all by testing a random nonexistent address.
 * If the server accepts a random address, it's catch-all.
 */
async function detectCatchAll(domain: string, mxHost: string): Promise<boolean> {
  const random = `blkvrfy-${Math.random().toString(36).slice(2, 14)}@${domain}`;
  try {
    const result = await smtpVerify(random, mxHost);
    return result.status === 'passed'; // If random address accepted → catch-all
  } catch {
    return false;
  }
}

/**
 * Verify a single email address — full pipeline:
 * 1. Syntax  2. Disposable  3. MX lookup  4. SMTP RCPT TO  5. Catch-all detection
 */
export async function verifyEmail(email: string): Promise<VerificationResult> {
  const trimmed = email.trim().toLowerCase();
  const [local, domain] = trimmed.split('@');

  const baseDetails: VerificationResult['details'] = {
    syntax: false, mxExists: false, disposable: false,
    catchAll: false, roleAccount: false,
    smtpCheck: 'skipped',
  };

  // 1. Syntax check
  if (!isValidSyntax(trimmed) || !local || !domain) {
    return {
      email: trimmed, result: 'invalid',
      details: { ...baseDetails },
      reason: 'Invalid email format',
    };
  }
  baseDetails.syntax = true;

  // 2. Disposable check
  if (isDisposable(domain)) {
    return {
      email: trimmed, result: 'disposable',
      details: { ...baseDetails, disposable: true },
      reason: `Disposable email provider: ${domain}`,
    };
  }

  // 3. MX record check
  const mx = await checkMX(domain);
  if (!mx.exists) {
    return {
      email: trimmed, result: 'invalid',
      details: { ...baseDetails },
      reason: `Domain ${domain} has no mail server (no MX records)`,
    };
  }
  baseDetails.mxExists = true;

  const roleAccount = isRoleAccount(local);
  baseDetails.roleAccount = roleAccount;

  const mxHost = mx.records[0].exchange;

  // 4. Skip SMTP check for providers that block it (Gmail, Outlook, etc.)
  if (SMTP_BLOCKED_PROVIDERS.has(domain.toLowerCase())) {
    return {
      email: trimmed,
      result: roleAccount ? 'risky' : 'risky',
      details: { ...baseDetails, smtpCheck: 'blocked', smtpResponse: `${domain} blocks SMTP verification` },
      reason: `${domain} blocks SMTP verification — mailbox existence cannot be confirmed. MX records valid.`,
    };
  }

  // 5. Known catch-all domains
  if (KNOWN_CATCH_ALL.has(domain.toLowerCase())) {
    return {
      email: trimmed, result: 'catch_all',
      details: { ...baseDetails, catchAll: true, smtpCheck: 'skipped', smtpResponse: 'Known catch-all domain' },
      reason: `${domain} is a known catch-all domain — accepts all addresses`,
    };
  }

  // 6. SMTP handshake verification
  const smtp = await smtpVerify(trimmed, mxHost);
  baseDetails.smtpCheck = smtp.status;

  if (smtp.status === 'failed') {
    return {
      email: trimmed, result: 'invalid',
      details: { ...baseDetails, smtpResponse: smtp.response },
      reason: `Mailbox does not exist — server replied: ${smtp.response}`,
    };
  }

  if (smtp.status === 'blocked') {
    return {
      email: trimmed, result: 'risky',
      details: { ...baseDetails, smtpResponse: smtp.response },
      reason: `SMTP verification blocked by server — mailbox may or may not exist. ${smtp.response}`,
    };
  }

  if (smtp.status === 'greylisted') {
    return {
      email: trimmed, result: 'risky',
      details: { ...baseDetails, smtpResponse: smtp.response },
      reason: `Server greylisted the request (temporary rejection) — try again later. ${smtp.response}`,
    };
  }

  // 7. SMTP passed — now check if domain is catch-all
  const isCatchAll = await detectCatchAll(domain, mxHost);
  if (isCatchAll) {
    baseDetails.catchAll = true;
    return {
      email: trimmed, result: 'catch_all',
      details: { ...baseDetails, smtpResponse: smtp.response },
      reason: `${domain} is a catch-all server — accepts all addresses, mailbox may not actually exist`,
    };
  }

  // 8. All checks passed
  if (roleAccount) {
    return {
      email: trimmed, result: 'risky',
      details: { ...baseDetails, smtpResponse: smtp.response },
      reason: `SMTP verified but role-based account (${local}@) — typically low engagement`,
    };
  }

  return {
    email: trimmed, result: 'valid',
    details: { ...baseDetails, smtpResponse: smtp.response },
    reason: 'SMTP verified — mailbox exists and is accepting mail',
  };
}

/**
 * Verify multiple emails in batch, updating the database
 */
export async function verifyLeadEmails(leadIds: string[]): Promise<{ verified: number; results: Record<VerifyResult, number> }> {
  const leads = await prisma.lead.findMany({
    where: { id: { in: leadIds } },
    select: { id: true, email: true },
  });

  const counts: Record<VerifyResult, number> = {
    valid: 0, invalid: 0, risky: 0, catch_all: 0, disposable: 0, unknown: 0,
  };

  for (const lead of leads) {
    try {
      const result = await verifyEmail(lead.email);
      counts[result.result]++;
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          emailVerified: true,
          verifyResult: result.result,
          verifiedAt: new Date(),
        },
      });
    } catch {
      counts.unknown++;
      await prisma.lead.update({
        where: { id: lead.id },
        data: {
          emailVerified: true,
          verifyResult: 'unknown',
          verifiedAt: new Date(),
        },
      });
    }
    // Rate limit: 500ms between SMTP verifications to avoid being flagged
    await new Promise(r => setTimeout(r, 500));
  }

  return { verified: leads.length, results: counts };
}

/**
 * Process spintax in text: {Hello|Hi|Hey} → randomly picks one
 */
export function processSpintax(text: string): string {
  return text.replace(/\{([^{}]+)\}/g, (_match, group: string) => {
    const options = group.split('|');
    return options[Math.floor(Math.random() * options.length)];
  });
}

/**
 * Pick an A/B variant based on weights
 */
export function pickVariant(variants: { subject: string; body: string; weight: number }[]): { subject: string; body: string } {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let rand = Math.random() * totalWeight;
  for (const variant of variants) {
    rand -= variant.weight;
    if (rand <= 0) return { subject: variant.subject, body: variant.body };
  }
  return variants[0];
}

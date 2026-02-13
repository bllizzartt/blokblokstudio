import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAdmin } from '@/lib/admin-auth';
import { decrypt } from '@/lib/crypto';
import * as nodemailer from 'nodemailer';
import * as tls from 'tls';

const TIMEOUT_MS = 10_000;

interface TestResult {
  success: boolean;
  latency: number;
  error?: string;
}

// POST /api/admin/test-connection — test SMTP and IMAP connectivity
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    let smtpHost: string;
    let smtpPort: number;
    let smtpUser: string;
    let smtpPass: string;
    let imapHost: string | null = null;
    let imapPort: number | null = null;
    let imapUser: string | null = null;
    let imapPass: string | null = null;

    if (body.accountId) {
      // Look up account from database and decrypt passwords
      const account = await prisma.sendingAccount.findUnique({
        where: { id: body.accountId },
      });

      if (!account) {
        return NextResponse.json({ error: 'Account not found' }, { status: 404 });
      }

      smtpHost = account.smtpHost;
      smtpPort = account.smtpPort;
      smtpUser = account.smtpUser;
      smtpPass = decrypt(account.smtpPass);

      if (account.imapHost && account.imapUser && account.imapPass) {
        imapHost = account.imapHost;
        imapPort = account.imapPort;
        imapUser = account.imapUser;
        imapPass = decrypt(account.imapPass);
      }
    } else {
      // Use directly provided credentials
      if (!body.smtpHost || !body.smtpUser || !body.smtpPass) {
        return NextResponse.json({ error: 'Missing required SMTP fields' }, { status: 400 });
      }

      smtpHost = body.smtpHost;
      smtpPort = body.smtpPort || 587;
      smtpUser = body.smtpUser;
      smtpPass = body.smtpPass;

      if (body.imapHost && body.imapUser && body.imapPass) {
        imapHost = body.imapHost;
        imapPort = body.imapPort || 993;
        imapUser = body.imapUser;
        imapPass = body.imapPass;
      }
    }

    // Test SMTP
    const smtpResult = await testSmtp(smtpHost, smtpPort, smtpUser, smtpPass);

    // Test IMAP (only if credentials are available)
    let imapResult: TestResult;
    if (imapHost && imapUser && imapPass) {
      imapResult = await testImap(imapHost, imapPort || 993, imapUser, imapPass);
    } else {
      imapResult = { success: false, latency: 0, error: 'IMAP not configured' };
    }

    return NextResponse.json({ smtp: smtpResult, imap: imapResult });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Connection test failed: ${errMsg.slice(0, 200)}` }, { status: 500 });
  }
}

async function testSmtp(host: string, port: number, user: string, pass: string): Promise<TestResult> {
  const start = Date.now();
  try {
    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      connectionTimeout: TIMEOUT_MS,
      greetingTimeout: TIMEOUT_MS,
      socketTimeout: TIMEOUT_MS,
    });

    await transport.verify();
    transport.close();

    return { success: true, latency: Date.now() - start };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return { success: false, latency: Date.now() - start, error: errMsg };
  }
}

function testImap(host: string, port: number, user: string, pass: string): Promise<TestResult> {
  return new Promise((resolve) => {
    const start = Date.now();
    const timeout = setTimeout(() => {
      socket.destroy();
      resolve({ success: false, latency: Date.now() - start, error: 'Connection timed out' });
    }, TIMEOUT_MS);

    const socket = tls.connect({ host, port, rejectUnauthorized: false }, () => {
      // Connection established, wait for server greeting
    });

    let data = '';

    socket.on('data', (chunk) => {
      data += chunk.toString();
      if (data.includes('OK')) {
        clearTimeout(timeout);
        socket.destroy();
        resolve({ success: true, latency: Date.now() - start });
      }
    });

    socket.on('error', (err) => {
      clearTimeout(timeout);
      socket.destroy();
      resolve({ success: false, latency: Date.now() - start, error: err.message });
    });

    socket.on('close', () => {
      clearTimeout(timeout);
      if (!data.includes('OK')) {
        resolve({ success: false, latency: Date.now() - start, error: 'Connection closed without OK response' });
      }
    });
  });
}

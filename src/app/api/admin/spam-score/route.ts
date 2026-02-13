import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { analyzeSpamScore } from '@/lib/blacklist-monitor';

/**
 * POST /api/admin/spam-score — enhanced pre-flight spam analysis
 *
 * Analyzes email subject + body for spam triggers, HTML quality,
 * and returns actionable recommendations with specific fixes.
 *
 * Use this before sending campaigns to catch content that ISPs will flag.
 */
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { subject, body } = await req.json();
    if (!subject && !body) {
      return NextResponse.json({ error: 'Provide subject and/or body' }, { status: 400 });
    }

    const result = analyzeSpamScore(subject || '', body || '');

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 });
  }
}

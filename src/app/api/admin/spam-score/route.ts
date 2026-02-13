import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';

const SPAM_TRIGGERS = [
  // Urgency
  { pattern: /act now/i, weight: 3, category: 'urgency' },
  { pattern: /limited time/i, weight: 3, category: 'urgency' },
  { pattern: /hurry/i, weight: 2, category: 'urgency' },
  { pattern: /don't miss/i, weight: 2, category: 'urgency' },
  { pattern: /expires?\b/i, weight: 2, category: 'urgency' },
  { pattern: /urgent/i, weight: 3, category: 'urgency' },
  { pattern: /last chance/i, weight: 3, category: 'urgency' },
  // Money
  { pattern: /free\b/i, weight: 2, category: 'money' },
  { pattern: /\$\d+/i, weight: 2, category: 'money' },
  { pattern: /discount/i, weight: 2, category: 'money' },
  { pattern: /cheap/i, weight: 3, category: 'money' },
  { pattern: /earn money/i, weight: 4, category: 'money' },
  { pattern: /cash bonus/i, weight: 4, category: 'money' },
  { pattern: /no cost/i, weight: 3, category: 'money' },
  { pattern: /double your/i, weight: 4, category: 'money' },
  { pattern: /million dollars/i, weight: 5, category: 'money' },
  // Shady
  { pattern: /click (here|below)/i, weight: 2, category: 'shady' },
  { pattern: /buy now/i, weight: 3, category: 'shady' },
  { pattern: /order now/i, weight: 3, category: 'shady' },
  { pattern: /sign up free/i, weight: 2, category: 'shady' },
  { pattern: /no obligation/i, weight: 2, category: 'shady' },
  { pattern: /risk[- ]free/i, weight: 2, category: 'shady' },
  { pattern: /guaranteed/i, weight: 2, category: 'shady' },
  { pattern: /winner/i, weight: 3, category: 'shady' },
  { pattern: /congratulations/i, weight: 3, category: 'shady' },
  // Formatting
  { pattern: /[A-Z]{5,}/g, weight: 2, category: 'formatting' }, // ALL CAPS words
  { pattern: /!{2,}/g, weight: 2, category: 'formatting' }, // Multiple exclamation marks
  { pattern: /\${2,}/g, weight: 3, category: 'formatting' }, // Multiple dollar signs
];

export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  try {
    const { subject, body } = await req.json();
    if (!subject && !body) {
      return NextResponse.json({ error: 'Provide subject and/or body' }, { status: 400 });
    }

    const combined = `${subject || ''} ${body || ''}`;
    const issues: { trigger: string; category: string; weight: number }[] = [];
    let totalWeight = 0;

    for (const trigger of SPAM_TRIGGERS) {
      const matches = combined.match(trigger.pattern);
      if (matches) {
        issues.push({ trigger: matches[0], category: trigger.category, weight: trigger.weight });
        totalWeight += trigger.weight;
      }
    }

    // Check link-to-text ratio
    const linkCount = (combined.match(/https?:\/\//g) || []).length;
    const wordCount = combined.split(/\s+/).length;
    const linkRatio = wordCount > 0 ? linkCount / wordCount : 0;
    if (linkRatio > 0.1) {
      issues.push({ trigger: `High link ratio: ${(linkRatio * 100).toFixed(0)}%`, category: 'links', weight: 3 });
      totalWeight += 3;
    }

    // Check if subject is ALL CAPS
    if (subject && subject === subject.toUpperCase() && subject.length > 5) {
      issues.push({ trigger: 'Subject line is all caps', category: 'formatting', weight: 4 });
      totalWeight += 4;
    }

    // Score: 0-100 (0 = clean, 100 = very spammy)
    const score = Math.min(100, Math.round(totalWeight * 5));
    const rating = score <= 20 ? 'clean' : score <= 40 ? 'low_risk' : score <= 60 ? 'medium_risk' : score <= 80 ? 'high_risk' : 'spam';

    return NextResponse.json({ score, rating, issues, totalWeight });
  } catch {
    return NextResponse.json({ error: 'Failed to analyze' }, { status: 500 });
  }
}

type Sentiment = 'positive' | 'negative' | 'neutral' | 'ooo' | 'auto_reply';

interface SentimentResult {
  sentiment: Sentiment;
  confidence: number;
  reasons: string[];
}

const OOO_PATTERNS = [
  'out of office',
  'on vacation',
  'on leave',
  'away from',
  'returning on',
  'back in the office',
  'auto-reply',
  'automatic reply',
  'autoreply',
];

const AUTO_REPLY_PATTERNS = [
  'auto-reply',
  'automatic reply',
  'do not reply',
  'noreply',
  'mailer-daemon',
  'postmaster',
];

const POSITIVE_PATTERNS = [
  'interested',
  "let's talk",
  "let's chat",
  'schedule a call',
  'sounds good',
  'tell me more',
  'send me',
  "i'd love",
  'great',
  'awesome',
  'perfect',
  'looking forward',
  'when can',
  'available',
  'free to',
  'book a',
  'set up a',
  'pricing',
  'cost',
  'proposal',
  'demo',
];

const NEGATIVE_PATTERNS = [
  'not interested',
  'no thanks',
  'no thank you',
  'remove me',
  'unsubscribe',
  'stop emailing',
  "don't contact",
  'not a good fit',
  'not looking',
  'already have',
  'no need',
  'pass on this',
  'take me off',
];

function matchPatterns(text: string, patterns: string[]): string[] {
  const lower = text.toLowerCase();
  return patterns.filter((pattern) => lower.includes(pattern));
}

function confidenceFromCount(count: number): number {
  if (count === 0) return 0;
  if (count === 1) return 0.6;
  if (count === 2) return 0.8;
  return 0.95;
}

export function analyzeSentiment(subject: string, body: string): SentimentResult {
  const combined = `${subject} ${body}`;

  const oooMatches = matchPatterns(combined, OOO_PATTERNS);
  if (oooMatches.length > 0) {
    return {
      sentiment: 'ooo',
      confidence: confidenceFromCount(oooMatches.length),
      reasons: oooMatches,
    };
  }

  const autoReplyMatches = matchPatterns(combined, AUTO_REPLY_PATTERNS);
  if (autoReplyMatches.length > 0) {
    return {
      sentiment: 'auto_reply',
      confidence: confidenceFromCount(autoReplyMatches.length),
      reasons: autoReplyMatches,
    };
  }

  const positiveMatches = matchPatterns(combined, POSITIVE_PATTERNS);
  const negativeMatches = matchPatterns(combined, NEGATIVE_PATTERNS);

  if (negativeMatches.length > 0 && negativeMatches.length >= positiveMatches.length) {
    return {
      sentiment: 'negative',
      confidence: confidenceFromCount(negativeMatches.length),
      reasons: negativeMatches,
    };
  }

  if (positiveMatches.length > 0) {
    return {
      sentiment: 'positive',
      confidence: confidenceFromCount(positiveMatches.length),
      reasons: positiveMatches,
    };
  }

  return {
    sentiment: 'neutral',
    confidence: 0.5,
    reasons: [],
  };
}

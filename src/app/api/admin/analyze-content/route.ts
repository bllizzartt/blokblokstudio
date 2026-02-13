import { NextRequest, NextResponse } from 'next/server';
import { checkAdmin } from '@/lib/admin-auth';
import { analyzeAiDetectionRisk, applyStylometricVariation } from '@/lib/stylometry';

/**
 * POST /api/admin/analyze-content — Analyze email copy for AI detection risk
 *
 * Returns:
 * - AI detection risk score (0-100)
 * - Risk factors found
 * - Suggested improved version with stylometric variation applied
 *
 * Use this in the campaign builder to check copy before sending.
 */
export async function POST(req: NextRequest) {
  const authError = checkAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { text } = body as { text?: string };

  if (!text || typeof text !== 'string') {
    return NextResponse.json({ error: 'Missing text field' }, { status: 400 });
  }

  // Analyze original text
  const originalAnalysis = analyzeAiDetectionRisk(text);

  // Generate improved version
  const improved = applyStylometricVariation(text, 0.6);
  const improvedAnalysis = analyzeAiDetectionRisk(improved);

  return NextResponse.json({
    original: {
      score: originalAnalysis.score,
      risk: originalAnalysis.risk,
      factors: originalAnalysis.factors,
    },
    improved: {
      text: improved,
      score: improvedAnalysis.score,
      risk: improvedAnalysis.risk,
      factors: improvedAnalysis.factors,
      improvement: originalAnalysis.score - improvedAnalysis.score,
    },
  });
}

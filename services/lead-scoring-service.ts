import type { CompanyResearch } from "@/types";

/** Score at or above which a lead is considered qualified. */
export const QUALIFIED_SCORE = 60;

/**
 * Lead scoring. The primary score comes from AI research; this service
 * validates it and provides a deterministic fallback so scores stay
 * meaningful even when the model returns something odd.
 */
export const LeadScoringService = {
  clampScore(score: number): number {
    return Math.max(0, Math.min(100, Math.round(score)));
  },

  /** Heuristic fallback when the AI didn't return a usable score. */
  fallbackScore(research: Partial<CompanyResearch>): number {
    let score = 40;
    if (research.digitalMaturity === "low") score += 25;
    else if (research.digitalMaturity === "medium") score += 15;
    score += Math.min(15, (research.automationOpportunities?.length ?? 0) * 5);
    score += Math.min(10, (research.operationalInefficiencies?.length ?? 0) * 3);
    score += Math.min(10, (research.consultingServices?.length ?? 0) * 3);
    return this.clampScore(score);
  },

  resolveScore(research: CompanyResearch): number {
    const score = research.leadScore;
    if (typeof score === "number" && score > 0 && score <= 100) return this.clampScore(score);
    return this.fallbackScore(research);
  },

  isQualified(score: number | null): boolean {
    return score !== null && score >= QUALIFIED_SCORE;
  },
};

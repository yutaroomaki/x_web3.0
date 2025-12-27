import type { NormalizedItem, BuzzCandidateResult } from "./types";

// Scoring thresholds
const CANDIDATE_THRESHOLD = 50;

// Weight configuration
const WEIGHTS = {
  engagement: 0.3,
  recency: 0.2,
  author_influence: 0.15,
  content_quality: 0.2,
  viral_signals: 0.15,
};

/**
 * Calculate buzz candidate score for a normalized item
 */
export function calculateCandidateScore(
  item: NormalizedItem
): BuzzCandidateResult {
  const reasons: BuzzCandidateResult["reasons"] = [];
  const features: Record<string, number | string> = {};
  let totalScore = 0;

  // 1. Engagement Score (likes, retweets, views, etc.)
  const engagementScore = calculateEngagementScore(item);
  features.engagement = engagementScore;
  if (engagementScore > 0) {
    const weight = WEIGHTS.engagement * 100;
    totalScore += engagementScore * WEIGHTS.engagement;
    reasons.push({
      code: "HIGH_ENGAGEMENT",
      label: "High engagement metrics",
      weight,
      detail: `Engagement score: ${engagementScore.toFixed(0)}`,
    });
  }

  // 2. Recency Score (favor recent content)
  const recencyScore = calculateRecencyScore(item);
  features.recency = recencyScore;
  totalScore += recencyScore * WEIGHTS.recency;
  if (recencyScore > 70) {
    reasons.push({
      code: "RECENT",
      label: "Fresh content",
      weight: WEIGHTS.recency * 100,
      detail: `Published ${getTimeDiff(item.publishedAt)}`,
    });
  }

  // 3. Author Influence Score
  const authorScore = calculateAuthorScore(item);
  features.author_influence = authorScore;
  totalScore += authorScore * WEIGHTS.author_influence;
  if (authorScore > 70) {
    reasons.push({
      code: "INFLUENTIAL_AUTHOR",
      label: "Influential author",
      weight: WEIGHTS.author_influence * 100,
      detail: `Followers: ${item.author?.followers ?? "unknown"}`,
    });
  }

  // 4. Content Quality Score
  const contentScore = calculateContentScore(item);
  features.content_quality = contentScore;
  totalScore += contentScore * WEIGHTS.content_quality;
  if (contentScore > 60) {
    reasons.push({
      code: "QUALITY_CONTENT",
      label: "Quality content signals",
      weight: WEIGHTS.content_quality * 100,
    });
  }

  // 5. Viral Signals Score
  const viralScore = calculateViralSignals(item);
  features.viral_signals = viralScore;
  totalScore += viralScore * WEIGHTS.viral_signals;
  if (viralScore > 50) {
    reasons.push({
      code: "VIRAL_SIGNALS",
      label: "Viral pattern detected",
      weight: WEIGHTS.viral_signals * 100,
    });
  }

  // Platform bonus
  features.platform = item.platform;

  return {
    score: Math.min(100, Math.round(totalScore)),
    reasons,
    features,
  };
}

/**
 * Check if item passes candidate threshold
 */
export function isCandidate(result: BuzzCandidateResult): boolean {
  return result.score >= CANDIDATE_THRESHOLD;
}

// Helper functions
function calculateEngagementScore(item: NormalizedItem): number {
  const metrics = item.metrics ?? {};

  // Platform-specific engagement calculation
  switch (item.platform) {
    case "x": {
      const likes = metrics.likes ?? 0;
      const retweets = metrics.retweets ?? 0;
      const replies = metrics.replies ?? 0;
      const total = likes + retweets * 2 + replies * 1.5;
      return Math.min(100, Math.log10(total + 1) * 25);
    }
    case "youtube": {
      const views = metrics.views ?? 0;
      const likes = metrics.likes ?? 0;
      const comments = metrics.comments ?? 0;
      const engagement = (likes + comments * 2) / Math.max(1, views) * 1000;
      return Math.min(100, engagement * 10 + Math.log10(views + 1) * 10);
    }
    case "news": {
      // News doesn't typically have engagement metrics
      return 50; // Neutral score
    }
    default:
      return 30;
  }
}

function calculateRecencyScore(item: NormalizedItem): number {
  const publishedAt = new Date(item.publishedAt);
  const now = new Date();
  const hoursAgo = (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);

  if (hoursAgo <= 6) return 100;
  if (hoursAgo <= 12) return 90;
  if (hoursAgo <= 24) return 80;
  if (hoursAgo <= 48) return 60;
  if (hoursAgo <= 72) return 40;
  return 20;
}

function calculateAuthorScore(item: NormalizedItem): number {
  const followers = item.author?.followers ?? 0;

  if (followers >= 1000000) return 100;
  if (followers >= 100000) return 85;
  if (followers >= 10000) return 70;
  if (followers >= 1000) return 50;
  if (followers >= 100) return 30;
  return 10;
}

function calculateContentScore(item: NormalizedItem): number {
  const text = item.text ?? "";
  let score = 50; // Base score

  // Length check (optimal tweet length: 100-280 chars)
  if (text.length >= 100 && text.length <= 280) {
    score += 20;
  } else if (text.length > 0) {
    score += 10;
  }

  // Has hashtags
  if (/#\w+/.test(text)) {
    score += 10;
  }

  // Has numbers/stats
  if (/\d+%|\$\d+|[0-9]+x|[0-9]+倍/.test(text)) {
    score += 15;
  }

  // Has question mark (engagement driver)
  if (/\?|？/.test(text)) {
    score += 5;
  }

  return Math.min(100, score);
}

function calculateViralSignals(item: NormalizedItem): number {
  const text = (item.text ?? "").toLowerCase();
  let score = 0;

  // Urgency words
  const urgencyPatterns = [
    /速報/,
    /緊急/,
    /breaking/,
    /just in/,
    /today/,
    /now/,
    /今/,
  ];
  if (urgencyPatterns.some((p) => p.test(text))) {
    score += 25;
  }

  // Crypto-specific viral triggers
  const cryptoPatterns = [
    /moon|ムーン/,
    /pump|ポンプ/,
    /100x|1000x/,
    /whale|クジラ/,
    /airdrop|エアドロ/,
    /breaking/,
  ];
  if (cryptoPatterns.some((p) => p.test(text))) {
    score += 30;
  }

  // Emotional triggers
  const emotionPatterns = [
    /!{2,}|！{2,}/,
    /🚀|💰|🔥|📈|💎/,
    /amazing|incredible|insane/,
    /やばい|すごい|神/,
  ];
  if (emotionPatterns.some((p) => p.test(text))) {
    score += 20;
  }

  // High growth metrics
  const metrics = item.metrics ?? {};
  if (item.platform === "x") {
    const ratio = (metrics.retweets ?? 0) / Math.max(1, metrics.likes ?? 1);
    if (ratio > 0.3) score += 25; // High RT ratio indicates viral potential
  }

  return Math.min(100, score);
}

function getTimeDiff(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

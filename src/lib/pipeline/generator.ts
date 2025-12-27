import type { OutlinePlan, DraftPayload, ViralAnalysisResult } from "./types";
import { getTemplateByCode, type Template } from "./templates";

// System prompt for X post generation (from spec)
const SYSTEM_PROMPT = `あなたは「X（旧Twitter）で投稿をバズらせる専門エージェント」です。
暗号通貨・ミームコインの最新情報を、Xで拡散されやすい投稿構造に再設計してください。

【絶対ルール】
- 感情70% / 情報30%
- 1行目は必ずフック（問いかけ型/衝撃事実型/共感体験型）
- 「あなた」視点で書く
- 数字（%/時間/日付）を可能な限り入れる
- 改行を多用し、短文中心で読みやすく
- 最後に必ずCTA（RT/いいね/ブクマ/フォロー/続報予告）
- 出力は日本語
- 誇張しすぎや断定しすぎは避け、リスクがある場合はrisk_noteに記載する

【出力フォーマット：JSON】
{
  "post_text": "...",
  "template_type": "...",
  "emotion_triggers": ["..."],
  "trend_score": 0-100,
  "risk_flags": {
    "hype_level": "low|medium|high",
    "info_certainty": "low|medium|high",
    "notes": "..."
  }
}`;

/**
 * Generate draft post from outline and analysis
 * Note: This is a simplified implementation. In production, this would call an LLM.
 */
export function generateDraft(
  outline: OutlinePlan,
  analysis: ViralAnalysisResult,
  originalText: string,
  candidateScore: number
): DraftPayload {
  const template = getTemplateByCode(outline.template_choice.code);

  if (!template) {
    throw new Error(`Template not found: ${outline.template_choice.code}`);
  }

  // Build the post using template structure
  const postText = buildPostText(template, outline, originalText);

  // Calculate trend score based on candidate score and analysis
  const trendScore = calculateTrendScore(candidateScore, analysis);

  // Determine emotion triggers from analysis
  const emotionTriggers = extractEmotionTriggers(analysis.emotion_profile);

  // Assess risk flags
  const riskFlags = assessRiskFlags(analysis, originalText);

  return {
    post_text: postText,
    template_type: template.name,
    emotion_triggers: emotionTriggers,
    trend_score: trendScore,
    risk_flags: riskFlags,
  };
}

/**
 * Build post text using template and outline
 */
function buildPostText(
  template: Template,
  outline: OutlinePlan,
  _originalText: string
): string {
  const parts: string[] = [];

  // Hook (first line - most important)
  parts.push(outline.hook_draft);

  // Key points (body)
  if (outline.key_points.length > 0) {
    parts.push(""); // Empty line for spacing
    outline.key_points.forEach((point) => {
      parts.push(point);
    });
  }

  // CTA (call to action)
  parts.push(""); // Empty line for spacing
  parts.push(outline.cta_draft);

  return parts.join("\n");
}

/**
 * Calculate trend score based on multiple factors
 */
function calculateTrendScore(
  candidateScore: number,
  analysis: ViralAnalysisResult
): number {
  let score = candidateScore;

  // Bonus for strong hook type
  if (analysis.hook_type === "shock") {
    score += 5;
  }

  // Bonus for having CTA
  if (analysis.cta_type !== "none") {
    score += 5;
  }

  // Penalty for high risk
  if (analysis.risks.hype_risk === "high") {
    score -= 10;
  }
  if (analysis.risks.scam_suspect) {
    score -= 20;
  }

  // Bonus for high emotion profile scores
  const avgEmotion =
    Object.values(analysis.emotion_profile).reduce((a, b) => a + b, 0) /
    Math.max(1, Object.values(analysis.emotion_profile).length);
  score += Math.round(avgEmotion * 10);

  return Math.max(0, Math.min(100, score));
}

/**
 * Extract top emotion triggers from profile
 */
function extractEmotionTriggers(
  emotionProfile: Record<string, number>
): string[] {
  return Object.entries(emotionProfile)
    .filter(([, value]) => value > 0.3)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([key]) => key);
}

/**
 * Assess risk flags based on analysis and content
 */
function assessRiskFlags(
  analysis: ViralAnalysisResult,
  originalText: string
): DraftPayload["risk_flags"] {
  const text = originalText.toLowerCase();
  const notes: string[] = [];

  // Check for hype indicators
  let hypeLevel: "low" | "medium" | "high" = "low";
  const hypePatterns = [
    /100x/,
    /1000x/,
    /moon/,
    /guaranteed/,
    /確実/,
    /絶対/,
    /必ず/,
  ];
  const hypeCount = hypePatterns.filter((p) => p.test(text)).length;
  if (hypeCount >= 2) {
    hypeLevel = "high";
    notes.push("複数の誇大表現を検出");
  } else if (hypeCount === 1) {
    hypeLevel = "medium";
    notes.push("誇大表現の可能性");
  }

  // Override with analysis result if higher
  if (
    analysis.risks.hype_risk === "high" ||
    (analysis.risks.hype_risk === "medium" && hypeLevel === "low")
  ) {
    hypeLevel = analysis.risks.hype_risk;
  }

  // Check for certainty level
  let infoCertainty: "low" | "medium" | "high" = analysis.risks.certainty;
  const uncertainPatterns = [/rumor/i, /噂/, /らしい/, /かも/, /未確認/];
  if (uncertainPatterns.some((p) => p.test(text))) {
    if (infoCertainty === "high") {
      infoCertainty = "medium";
    }
    notes.push("情報の確実性に注意");
  }

  // Add scam warning if detected
  if (analysis.risks.scam_suspect) {
    notes.push("詐欺の疑いあり - 要確認");
  }

  // Add notes from analysis
  notes.push(...analysis.risks.notes);

  return {
    hype_level: hypeLevel,
    info_certainty: infoCertainty,
    notes: notes.join("; ") || "特記事項なし",
  };
}

/**
 * Get system prompt for LLM
 */
export function getSystemPrompt(): string {
  return SYSTEM_PROMPT;
}

/**
 * Parse LLM response to DraftPayload
 */
export function parseLLMResponse(response: string): DraftPayload {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Validate required fields
    if (!parsed.post_text || typeof parsed.post_text !== "string") {
      throw new Error("Invalid post_text");
    }

    return {
      post_text: parsed.post_text,
      template_type: parsed.template_type || "unknown",
      emotion_triggers: Array.isArray(parsed.emotion_triggers)
        ? parsed.emotion_triggers
        : [],
      trend_score:
        typeof parsed.trend_score === "number" ? parsed.trend_score : 50,
      risk_flags: {
        hype_level: parsed.risk_flags?.hype_level || "medium",
        info_certainty: parsed.risk_flags?.info_certainty || "medium",
        notes: parsed.risk_flags?.notes || "",
      },
    };
  } catch {
    throw new Error(`Failed to parse LLM response: ${response.slice(0, 100)}`);
  }
}

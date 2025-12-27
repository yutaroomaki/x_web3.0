// Normalized Item (IngestItem format)
export type NormalizedItem = {
  externalId: string; // `${platform}:${id}` (unique)
  platform: "x" | "news" | "youtube" | "manual";
  url: string;
  publishedAt: string; // ISO
  ingestedAt: string; // ISO
  language: string | null;
  text: string | null;
  title?: string | null;
  author?: {
    id?: string;
    name?: string;
    handle?: string;
    followers?: number;
  };
  metrics?: Record<string, number>;
  raw: unknown;
};

// Candidate Score (BuzzCandidate)
export type BuzzCandidateResult = {
  score: number; // 0-100
  reasons: Array<{
    code: string;
    label: string;
    weight: number;
    detail?: string;
  }>;
  features: Record<string, number | string>;
};

// Viral Analysis (ViralAnalysis)
export type ViralAnalysisResult = {
  detected_template_type: string;
  hook_type: "question" | "shock" | "empathy";
  cta_type:
    | "rt"
    | "like"
    | "bookmark"
    | "follow"
    | "tease_next"
    | "mixed"
    | "none";
  emotion_profile: Record<string, number>;
  short_summary: string;
  risks: {
    hype_risk: "low" | "medium" | "high";
    certainty: "low" | "medium" | "high";
    scam_suspect: boolean;
    notes: string[];
  };
};

// Outline (Outline)
export type OutlinePlan = {
  template_choice: { code: string; reason: string };
  hook_draft: string;
  key_points: string[];
  cta_draft: string;
  emotion_plan: Record<string, number>;
};

// Generated Draft (DraftPost)
export type DraftPayload = {
  post_text: string;
  template_type: string;
  emotion_triggers: string[];
  trend_score: number;
  risk_flags: {
    hype_level: "low" | "medium" | "high";
    info_certainty: "low" | "medium" | "high";
    notes: string;
  };
};

// Pipeline stats
export type PipelineStats = {
  ingested: number;
  candidates: number;
  analyzed: number;
  outlined: number;
  generated: number;
  skipped: number;
};

// Pipeline options
export type PipelineOptions = {
  dryRun: boolean;
  maxItems: number;
  fromHours: number;
  onlyPlatforms?: ("x" | "news" | "youtube" | "manual")[];
};

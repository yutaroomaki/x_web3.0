import { z } from "zod";

// Source schemas
export const SourceTypeSchema = z.enum([
  "X_SEARCH",
  "RSS",
  "YOUTUBE_SEARCH",
  "YOUTUBE_CHANNEL",
  "MANUAL",
]);

export const CreateSourceSchema = z.object({
  type: SourceTypeSchema,
  name: z.string().min(1).max(100),
  config: z.record(z.unknown()),
  enabled: z.boolean().optional().default(true),
});

export const UpdateSourceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  config: z.record(z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

// Draft schemas
export const DraftStatusSchema = z.enum(["pending", "approved", "rejected", "posted"]);

export const UpdateDraftSchema = z.object({
  postText: z.string().min(1).max(500),
});

export const DecisionActionSchema = z.enum(["approve", "reject", "posted"]);

export const CreateDecisionSchema = z.object({
  action: DecisionActionSchema,
  editedText: z.string().optional(),
  note: z.string().optional(),
});

// Job schemas
export const RunJobSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  maxItems: z.number().int().min(1).max(1000).optional().default(200),
  fromHours: z.number().int().min(1).max(168).optional().default(72),
  onlyPlatforms: z.array(z.enum(["x", "news", "youtube", "manual"])).optional(),
});

// Query schemas
export const SourceQuerySchema = z.object({
  enabled: z.coerce.boolean().optional(),
  type: SourceTypeSchema.optional(),
});

export const LengthCategorySchema = z.enum(["short", "medium", "long"]);

export const DraftQuerySchema = z.object({
  status: DraftStatusSchema.optional(),
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  lengthCategory: LengthCategorySchema.optional(),
  limit: z.coerce.number().int().min(1).max(500).optional().default(200),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

export const JobQuerySchema = z.object({
  status: z.enum(["running", "success", "failed"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

// Type exports
export type CreateSourceInput = z.infer<typeof CreateSourceSchema>;
export type UpdateSourceInput = z.infer<typeof UpdateSourceSchema>;
export type UpdateDraftInput = z.infer<typeof UpdateDraftSchema>;
export type CreateDecisionInput = z.infer<typeof CreateDecisionSchema>;
export type RunJobInput = z.infer<typeof RunJobSchema>;

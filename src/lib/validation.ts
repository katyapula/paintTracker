import { z } from "zod";

const trimmedName = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(120, "Name is too long");

export const createArmySchema = z.object({
  name: trimmedName,
});

export const updateArmySchema = z.object({
  name: trimmedName,
});

export const createSquadSchema = z.object({
  name: trimmedName,
  armyId: z.string().uuid(),
});

export const updateSquadSchema = z.object({
  name: trimmedName,
  armyId: z.string().uuid().optional(),
});

export const createMiniSchema = z.object({
  name: trimmedName,
  squadId: z.string().uuid(),
  description: z.string().trim().max(3000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).nullable().optional(),
});

export const updateMiniSchema = z.object({
  name: trimmedName,
  squadId: z.string().uuid().optional(),
  description: z.string().trim().max(3000).nullable().optional(),
  tags: z.array(z.string().trim().min(1).max(60)).max(30).nullable().optional(),
});

export const stageKeySchema = z.enum([
  "assembled",
  "primed",
  "painted",
  "based",
  "photographed",
]);

export const toggleStageSchema = z.object({
  stage: stageKeySchema,
  value: z.boolean(),
});

export type StageKey = z.infer<typeof stageKeySchema>;

export function normalizeNullableText(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function normalizeNullableTags(value: string[] | null | undefined) {
  if (!Array.isArray(value)) {
    return null;
  }

  const cleaned = value
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

  return cleaned.length > 0 ? cleaned : null;
}

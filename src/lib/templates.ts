import { z } from "zod";
import { MERGE_FIELDS, outreachContextSchema, usedMergeFields, type MergeField, type OutreachPlan } from "@/lib/outreach";

/** Outreach settings saved with a template. The goal may be empty for a hand-written email. */
export const briefSchema = outreachContextSchema
  .omit({ contactIds: true })
  .extend({ goal: z.string().trim().max(1000).default("") });

export type Brief = z.infer<typeof briefSchema>;

export const templateStepSchema = z.object({
  day_offset: z.int().min(0).max(365),
  purpose: z.string().trim().max(300).default(""),
  subject: z.string().trim().min(1, "Every step needs a subject.").max(300),
  body: z.string().trim().min(1, "Every step needs a body.").max(20000),
});

export type TemplateStep = z.infer<typeof templateStepSchema>;

const unknownPlaceholders = (steps: TemplateStep[]) =>
  steps
    .flatMap((s) => usedMergeFields(`${s.subject}\n${s.body}`))
    .filter((f) => !(MERGE_FIELDS as readonly string[]).includes(f));

/** A template version as the user saves it. */
export const templateSchema = z
  .object({
    name: z.string().trim().min(1, "Give the outreach a name.").max(200),
    brief: briefSchema,
    steps: z.array(templateStepSchema).min(1).max(10),
  })
  .refine((t) => unknownPlaceholders(t.steps).length === 0, {
    message: `Use only these placeholders: ${MERGE_FIELDS.map((f) => `{{${f}}}`).join(", ")}.`,
  });

export type TemplateInput = z.input<typeof templateSchema>;

export type Template = {
  id: string;
  family_id: string;
  version: number;
  name: string;
  brief: Brief;
  steps: TemplateStep[];
  created_at: string;
};

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Replaces whole-word occurrences of the given values with {{field}} placeholders, longest value first. */
export function templatize(text: string, values: Partial<Record<MergeField, string | null>>) {
  const pairs = (Object.entries(values) as [MergeField, string | null][])
    .filter((pair): pair is [MergeField, string] => !!pair[1]?.trim())
    .sort((a, b) => b[1].length - a[1].length);
  return pairs.reduce(
    (out, [field, value]) =>
      out.replace(new RegExp(`(?<![\\p{L}\\p{N}])${escape(value.trim())}(?![\\p{L}\\p{N}])`, "gu"), `{{${field}}}`),
    text,
  );
}

/** Builds template steps from an AI plan, using each step's first draft with that contact's details swapped for placeholders. */
export function planToSteps(
  plan: OutreachPlan,
  valuesFor: (contactId: string) => Partial<Record<MergeField, string | null>>,
): TemplateStep[] {
  return plan.steps.flatMap((s) => {
    const draft = s.drafts[0];
    if (!draft) return [];
    const values = valuesFor(draft.contact_id);
    return [{ day_offset: s.day_offset, purpose: s.purpose, subject: templatize(draft.subject, values), body: templatize(draft.body, values) }];
  });
}

/** The newest version of each template, newest template first. Rows may arrive in any order. */
export function latestVersions<T extends Pick<Template, "family_id" | "version" | "created_at">>(rows: T[]) {
  const latest = new Map<string, T>();
  for (const row of rows) {
    const seen = latest.get(row.family_id);
    if (!seen || row.version > seen.version) latest.set(row.family_id, row);
  }
  return [...latest.values()].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

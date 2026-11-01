import { tool, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { z } from "zod";

export const MAX_CONTACTS = 10;

/** Contact fields shared with the model. Email and phone are never sent. */
export const AI_FIELDS = [
  { key: "first_name", label: "First name" },
  { key: "last_name", label: "Last name" },
  { key: "company", label: "Company" },
  { key: "job_title", label: "Job title" },
  { key: "status", label: "Status" },
  { key: "notes", label: "Notes" },
] as const;

export type AiContact = { id: string } & Record<(typeof AI_FIELDS)[number]["key"], string | null>;

/** Fields the user can insert into their own email as {{field}}: the contact's details plus the sender's name. */
export const MERGE_FIELDS = ["first_name", "last_name", "company", "job_title", "your_name"] as const;

export type MergeField = (typeof MERGE_FIELDS)[number];

/** Placeholder names used in the text, e.g. "first_name" for {{first_name}}. */
export function usedMergeFields(text: string) {
  return [...new Set([...text.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((m) => m[1]))];
}

/** Replaces {{field}} placeholders with the given values. */
export function personalize(text: string, values: Record<MergeField, string | null>) {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: MergeField) => values[key] ?? "");
}

export const tones = ["friendly", "professional", "concise", "enthusiastic"] as const;

/** Campaign settings sent alongside each chat message. */
export const outreachContextSchema = z.object({
  contactIds: z.array(z.uuid()).min(1, "Select at least one contact.").max(MAX_CONTACTS),
  goal: z.string().trim().min(1, "Describe the outreach goal.").max(1000),
  audience: z.string().trim().max(1000).default(""),
  valueProp: z.string().trim().max(1000).default(""),
  tone: z.enum(tones).default("friendly"),
  cta: z.string().trim().max(300).default(""),
  avoid: z.string().trim().max(1000).default(""),
  mode: z.enum(["single", "sequence"]).default("single"),
});

export type OutreachContext = z.infer<typeof outreachContextSchema>;

/** Structured plan the model proposes; the user edits it before anything is saved. */
export const outreachPlanSchema = z.object({
  campaign_name: z.string().max(200).describe("Short campaign name"),
  summary: z.string().max(1000).describe("One or two sentences on the approach"),
  missing_info: z
    .array(z.string().max(300))
    .max(20)
    .describe("Details that would improve personalization but are missing from the CRM data"),
  steps: z
    .array(
      z.object({
        step: z.int().min(1).max(20),
        day_offset: z.int().min(0).max(365).describe("Days after the campaign starts"),
        purpose: z.string().max(300),
        drafts: z
          .array(
            z.object({
              contact_id: z.string().describe("The id of the contact this email is for"),
              subject: z.string().max(300),
              body: z.string().max(20000),
            }),
          )
          .max(MAX_CONTACTS),
      }),
    )
    .min(1)
    .max(10),
  follow_up_tasks: z
    .array(
      z.object({
        contact_id: z.string(),
        title: z.string().max(200),
        day_offset: z.int().min(0).max(365),
      }),
    )
    .max(50),
});

export type OutreachPlan = z.infer<typeof outreachPlanSchema>;

export const outreachTools = {
  proposeOutreach: tool({
    description:
      "Show the user an editable outreach plan: email drafts per contact for each step, plus suggested follow-up tasks. Call this whenever you produce or revise drafts.",
    inputSchema: outreachPlanSchema,
    execute: async () => ({ shown: true }),
  }),
};

export type OutreachUIMessage = UIMessage<never, UIDataTypes, InferUITools<typeof outreachTools>>;

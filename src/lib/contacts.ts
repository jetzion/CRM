import { z } from "zod";

export const contactStatuses = ["lead", "active", "customer", "inactive"] as const;
export type ContactStatus = (typeof contactStatuses)[number];

export type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  status: ContactStatus;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
  archived_at: string | null;
};

const optional = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => v || null);

/** Validates contact form input; empty optional fields become null. */
export const contactSchema = z.object({
  first_name: z.string().trim().min(1, "First name is required.").max(100),
  last_name: z.string().trim().max(100).default(""),
  email: z
    .union([z.literal(""), z.email("Enter a valid email address.")])
    .optional()
    .transform((v) => v || null),
  phone: optional(50),
  company: optional(200),
  job_title: optional(200),
  status: z.enum(contactStatuses),
  notes: optional(10000),
  tags: z.string().optional().transform((v) => parseTags(v ?? "")),
});

export function fullName(c: Pick<Contact, "first_name" | "last_name">) {
  return `${c.first_name} ${c.last_name}`.trim();
}

/** Splits comma-separated input into trimmed, unique (case-insensitive), non-empty tags. */
export function parseTags(input: string) {
  const tags = input.split(",").map((t) => t.trim().replace(/\s+/g, " ").slice(0, 50));
  const seen = new Set<string>();
  return tags.filter((t) => t && !seen.has(t.toLowerCase()) && seen.add(t.toLowerCase()));
}

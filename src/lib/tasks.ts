import { z } from "zod";

export type Task = {
  id: string;
  contact_id: string;
  title: string;
  due_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  contacts?: { first_name: string; last_name: string } | null;
};

/** Validates new-task form input. Due dates are stored at noon UTC so the calendar day never shifts. */
export const taskSchema = z.object({
  contact_id: z.uuid(),
  title: z.string().trim().min(1, "Title is required.").max(200),
  due_date: z
    .union([z.literal(""), z.iso.date("Enter a valid date.")])
    .optional()
    .transform((v) => (v ? `${v}T12:00:00Z` : null)),
  notes: z
    .string()
    .trim()
    .max(5000)
    .optional()
    .transform((v) => v || null),
});

/** Today's date as YYYY-MM-DD (UTC), matching how due dates are stored. */
export function today() {
  return new Date().toISOString().slice(0, 10);
}

export function isOverdue(task: Pick<Task, "due_at" | "completed_at">, now = today()) {
  return !task.completed_at && !!task.due_at && task.due_at.slice(0, 10) < now;
}

export function formatDue(dueAt: string) {
  return new Date(dueAt).toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

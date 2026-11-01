"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { taskSchema } from "@/lib/tasks";
import { requireUser } from "@/lib/supabase/server";

export type TaskFormState = {
  error?: string;
  fieldErrors?: Partial<Record<keyof z.infer<typeof taskSchema>, string[]>>;
  success?: string;
  values?: Record<string, string>;
};

function revalidateTaskViews(contactId?: string) {
  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (contactId) revalidatePath(`/contacts/${contactId}`);
}

/** Creates a follow-up task for the contact named by the form's `contact_id`. */
export async function createTask(_: TaskFormState, formData: FormData): Promise<TaskFormState> {
  const values = Object.fromEntries(formData) as Record<string, string>;
  const parsed = taskSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: z.flattenError(parsed.error).fieldErrors, values };

  const { due_date, ...rest } = parsed.data;
  const { supabase } = await requireUser();
  const { error } = await supabase.from("tasks").insert({ ...rest, due_at: due_date });
  if (error) return { error: "Could not add the task. Please try again.", values };

  revalidateTaskViews(rest.contact_id);
  return { success: "Task added." };
}

/** Marks the task named by the form's `id` complete, or reopens it. */
export async function setTaskDone(formData: FormData) {
  const id = z.uuid().parse(formData.get("id"));
  const done = formData.get("done") === "1";
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("tasks")
    .update({ completed_at: done ? new Date().toISOString() : null })
    .eq("id", id)
    .select("contact_id")
    .single();
  if (error) throw new Error("Could not update the task.");
  revalidateTaskViews(data.contact_id);
}

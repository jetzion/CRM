"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Select, Textarea } from "@/components/ui";
import { createTask, type TaskFormState } from "./actions";

type ContactOption = { id: string; name: string };

/** Form for adding a follow-up task, either for one contact or for a contact chosen from `contacts`. */
export function TaskForm({ contactId, contacts }: { contactId?: string; contacts?: ContactOption[] }) {
  const [state, action, pending] = useActionState<TaskFormState, FormData>(createTask, {});
  const err = (name: keyof NonNullable<TaskFormState["fieldErrors"]>) => state.fieldErrors?.[name]?.[0];

  return (
    <form action={action} className="space-y-3">
      {contactId ? (
        <input type="hidden" name="contact_id" value={contactId} />
      ) : (
        <Field label="Contact" htmlFor="task_contact" error={err("contact_id")}>
          <Select id="task_contact" name="contact_id" required defaultValue={state.values?.contact_id}>
            {contacts?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
        <Field label="Follow-up" htmlFor="title" error={err("title")}>
          <Input id="title" name="title" required maxLength={200} defaultValue={state.values?.title} placeholder="e.g. Send pricing" />
        </Field>
        <Field label="Due date" htmlFor="due_date" error={err("due_date")}>
          <Input id="due_date" name="due_date" type="date" defaultValue={state.values?.due_date} />
        </Field>
      </div>
      <Field label="Notes (optional)" htmlFor="task_notes" error={err("notes")}>
        <Textarea id="task_notes" name="notes" rows={2} defaultValue={state.values?.notes} />
      </Field>
      <FormMessage error={state.error ?? (contactId ? err("contact_id") : undefined)} success={state.success} />
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add task"}
      </Button>
    </form>
  );
}

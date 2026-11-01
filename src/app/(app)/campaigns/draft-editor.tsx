"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Textarea } from "@/components/ui";
import { updateDraft, type FormState } from "./actions";

type Draft = { id: string; subject: string; body: string };

/** Inline editor for one saved email draft. */
export function DraftEditor({ draft }: { draft: Draft }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateDraft, {});
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="id" value={draft.id} />
      <Field label="Subject" htmlFor={`subject-${draft.id}`}>
        <Input id={`subject-${draft.id}`} name="subject" required maxLength={300} defaultValue={draft.subject} />
      </Field>
      <Field label="Body" htmlFor={`body-${draft.id}`}>
        <Textarea id={`body-${draft.id}`} name="body" required rows={8} defaultValue={draft.body} />
      </Field>
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Saving..." : "Save draft"}
      </Button>
    </form>
  );
}

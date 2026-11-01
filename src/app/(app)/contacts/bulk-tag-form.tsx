"use client";

import { useActionState, useRef, type ReactNode } from "react";
import { Button, FormMessage, Input } from "@/components/ui";
import { tagContacts } from "./actions";

/** Wraps the contact list so checked rows (`ids`) can be tagged or untagged together. */
export function BulkTagForm({ children }: { children: ReactNode }) {
  const [state, action, pending] = useActionState(tagContacts, {});
  const formRef = useRef<HTMLFormElement>(null);

  function toggleAll(checked: boolean) {
    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[name="ids"]')
      .forEach((box) => (box.checked = checked));
  }

  return (
    <form ref={formRef} action={action} className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="mr-2 flex items-center gap-2 text-sm text-zinc-700">
          <input type="checkbox" onChange={(e) => toggleAll(e.target.checked)} className="size-4 accent-accent" />
          Select all
        </label>
        <div className="min-w-48 flex-1">
          <label htmlFor="bulk-tag" className="sr-only">Tag</label>
          <Input id="bulk-tag" name="tag" autoComplete="off" placeholder="Tag for selected contacts" />
        </div>
        <Button name="mode" value="add" disabled={pending}>Add tag</Button>
        <Button name="mode" value="remove" variant="secondary" disabled={pending}>Remove tag</Button>
      </div>
      <FormMessage error={state.error} success={state.success} />
      {children}
    </form>
  );
}

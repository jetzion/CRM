"use client";

import { useActionState } from "react";
import { Button, ButtonLink, Field, FormMessage, Input, Select, Textarea } from "@/components/ui";
import { contactStatuses, type Contact } from "@/lib/contacts";
import { saveContact, type ContactFormState } from "./actions";

type TextField = "first_name" | "last_name" | "email" | "phone" | "company" | "job_title";

const textFields: { name: TextField; label: string; type?: string; autoComplete?: string }[] = [
  { name: "first_name", label: "First name", autoComplete: "off" },
  { name: "last_name", label: "Last name", autoComplete: "off" },
  { name: "email", label: "Email", type: "email", autoComplete: "off" },
  { name: "phone", label: "Phone", type: "tel", autoComplete: "off" },
  { name: "company", label: "Company", autoComplete: "off" },
  { name: "job_title", label: "Job title", autoComplete: "off" },
];

/** Create/edit form for a contact. */
export function ContactForm({ contact }: { contact?: Contact }) {
  const [state, action, pending] = useActionState(saveContact, {});
  const errorFor = (name: keyof NonNullable<ContactFormState["fieldErrors"]>) =>
    state.fieldErrors?.[name]?.[0];
  const valueFor = (name: TextField | "status" | "notes") =>
    state.values?.[name] ?? contact?.[name] ?? "";

  return (
    <form action={action} className="space-y-5">
      {contact && <input type="hidden" name="id" value={contact.id} />}
      <div className="grid gap-4 sm:grid-cols-2">
        {textFields.map(({ name, label, type, autoComplete }) => (
          <Field key={name} label={label} htmlFor={name} error={errorFor(name)}>
            <Input
              id={name}
              name={name}
              type={type ?? "text"}
              autoComplete={autoComplete}
              defaultValue={valueFor(name)}
              required={name === "first_name"}
              aria-invalid={!!errorFor(name)}
              aria-describedby={errorFor(name) ? `${name}-error` : undefined}
            />
          </Field>
        ))}
        <Field label="Status" htmlFor="status" error={errorFor("status")}>
          <Select id="status" name="status" defaultValue={valueFor("status") || "lead"}>
            {contactStatuses.map((s) => (
              <option key={s} value={s}>
                {s[0].toUpperCase() + s.slice(1)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Tags" htmlFor="tags" error={errorFor("tags")}>
        <Input
          id="tags"
          name="tags"
          autoComplete="off"
          placeholder="Comma separated, for example: VIP, Q4 webinar"
          defaultValue={state.values?.tags ?? contact?.tags.join(", ") ?? ""}
        />
      </Field>
      <Field label="Notes" htmlFor="notes" error={errorFor("notes")}>
        <Textarea id="notes" name="notes" defaultValue={valueFor("notes")} rows={5} />
      </Field>
      <FormMessage error={state.error} />
      <div className="flex gap-2">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving..." : "Save contact"}
        </Button>
        <ButtonLink href={contact ? `/contacts/${contact.id}` : "/contacts"} variant="secondary">
          Cancel
        </ButtonLink>
      </div>
    </form>
  );
}

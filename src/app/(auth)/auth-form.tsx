"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input } from "@/components/ui";
import type { AuthState } from "./actions";

type FieldName = "display_name" | "email" | "password";

const fieldConfig: Record<FieldName, { label: string; type: string; autoComplete: string }> = {
  display_name: { label: "Your name", type: "text", autoComplete: "name" },
  email: { label: "Email", type: "email", autoComplete: "email" },
  password: { label: "Password", type: "password", autoComplete: "current-password" },
};

/** Generic auth form wired to a server action. */
export function AuthForm({
  action,
  fields,
  submitLabel,
  newPassword = false,
}: {
  action: (state: AuthState, formData: FormData) => Promise<AuthState>;
  fields: FieldName[];
  submitLabel: string;
  newPassword?: boolean;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  return (
    <form action={formAction} className="space-y-4">
      {fields.map((name) => {
        const { label, type, autoComplete } = fieldConfig[name];
        return (
          <Field key={name} label={label} htmlFor={name}>
            <Input
              id={name}
              name={name}
              type={type}
              autoComplete={name === "password" && newPassword ? "new-password" : autoComplete}
              required={name !== "display_name"}
              minLength={name === "password" ? 8 : undefined}
            />
          </Field>
        );
      })}
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Please wait..." : submitLabel}
      </Button>
    </form>
  );
}

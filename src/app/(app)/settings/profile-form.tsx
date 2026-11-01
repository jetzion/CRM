"use client";

import { useActionState } from "react";
import { Button, Field, FormMessage, Input, Textarea } from "@/components/ui";
import { updateProfile, type ProfileState } from "./actions";

export function ProfileForm({ displayName, signature }: { displayName: string; signature: string }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(updateProfile, {});
  return (
    <form action={action} className="space-y-3">
      <Field label="Display name" htmlFor="display_name">
        <Input id="display_name" name="display_name" maxLength={100} defaultValue={displayName} autoComplete="name" />
      </Field>
      <Field label="Email signature" htmlFor="signature">
        <Textarea
          id="signature"
          name="signature"
          rows={4}
          maxLength={1000}
          defaultValue={signature}
          placeholder={"Best regards,\nJane Doe\nFounder, Acme"}
        />
      </Field>
      <FormMessage error={state.error} success={state.success} />
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save profile"}
      </Button>
    </form>
  );
}

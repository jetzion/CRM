"use client";

import { useSearchParams } from "next/navigation";
import { FormMessage } from "@/components/ui";

/** Explains a failed email link (the auth callback redirects here with ?error=link). */
export function LinkError() {
  const failed = useSearchParams().get("error") === "link";
  return failed ? (
    <div className="mb-4">
      <FormMessage error="That link is invalid or has expired. Sign in, or request a new reset link." />
    </div>
  ) : null;
}

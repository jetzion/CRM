"use client";

import { Button } from "@/components/ui";

export default function AppError({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <div role="alert" className="rounded-lg bg-red-50 p-6">
      <h2 className="font-semibold text-red-900">Something went wrong</h2>
      <p className="mt-1 text-sm text-red-800">{error.message || "Please try again."}</p>
      <Button className="mt-4" variant="secondary" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button, Card, FormMessage, Input } from "@/components/ui";
import { manageTag } from "../actions";

/** One row per tag with rename and delete. Both apply to every contact that has the tag. */
export function TagManager({ tags }: { tags: { name: string; count: number }[] }) {
  const [state, action, pending] = useActionState(manageTag, {});

  return (
    <div className="space-y-3">
      <FormMessage error={state.error} success={state.success} />
      <Card className="p-0">
        <ul className="divide-y divide-zinc-200">
          {tags.map(({ name, count }) => (
            <li key={name}>
              <form action={action} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3">
                <input type="hidden" name="tag" value={name} />
                <span className="min-w-40 flex-1">
                  <span className="rounded-md bg-violet-100 px-1.5 py-0.5 text-sm font-medium text-violet-800">{name}</span>
                  <Link href={`/contacts?tag=${encodeURIComponent(name)}`} className="ml-2 text-sm text-zinc-600 hover:underline">
                    {count} contact{count === 1 ? "" : "s"}
                  </Link>
                </span>
                <div className="w-56">
                  <label htmlFor={`rename-${name}`} className="sr-only">New name for {name}</label>
                  <Input id={`rename-${name}`} name="name" defaultValue={name} maxLength={50} autoComplete="off" />
                </div>
                <Button name="intent" value="rename" variant="secondary" disabled={pending}>Rename</Button>
                <Button
                  name="intent"
                  value="delete"
                  variant="danger"
                  disabled={pending}
                  onClick={(e) => {
                    if (!confirm(`Delete "${name}" from ${count} contact${count === 1 ? "" : "s"}? The contacts are kept.`)) e.preventDefault();
                  }}
                >
                  Delete
                </Button>
              </form>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Input, Select } from "@/components/ui";
import { contactStatuses, fullName } from "@/lib/contacts";
import { isSharedMode, PERSONALIZE_LIMIT } from "@/lib/outreach";
import { TagList } from "../contacts/tag-list";
import type { PickerContact } from "./workspace";

/** Filterable checklist for choosing the outreach audience. */
export function ContactPicker({
  contacts,
  selected,
  onChange,
}: {
  contacts: PickerContact[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [company, setCompany] = useState("");
  const companies = [...new Set(contacts.map((c) => c.company).filter(Boolean) as string[])].sort();
  const allTags = [...new Set(contacts.flatMap((c) => c.tags))].sort();

  const term = q.trim().toLowerCase();
  const visible = contacts.filter(
    (c) =>
      (!status || c.status === status) &&
      (!company || c.company === company) &&
      (!term || `${fullName(c)} ${c.company ?? ""}`.toLowerCase().includes(term)),
  );

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  }

  const taggedIds = (tag: string) => contacts.filter((c) => c.tags.includes(tag)).map((c) => c.id);

  /** A tag is on when every contact carrying it is selected. */
  const tagOn = (tag: string) => taggedIds(tag).every((id) => selected.includes(id));

  /** Selects every contact with the tag, or deselects them all when the tag is already on. */
  function toggleTag(tag: string) {
    const ids = taggedIds(tag);
    if (tagOn(tag)) onChange(selected.filter((id) => !ids.includes(id)));
    else onChange([...selected, ...ids.filter((id) => !selected.includes(id))]);
  }

  function selectVisible() {
    const add = visible.map((c) => c.id).filter((id) => !selected.includes(id));
    onChange([...selected, ...add]);
  }

  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-zinc-700">
        Contacts <span className="font-normal text-zinc-500">({selected.length} selected)</span>
      </legend>
      {isSharedMode(selected.length) && (
        <p className="mb-2 rounded-md bg-violet-50 px-3 py-2 text-sm text-violet-900">
          More than {PERSONALIZE_LIMIT} contacts: the AI writes one email per step with placeholders like {"{{first_name}}"}, filled
          in for each contact when you save.
        </p>
      )}
      <div className="mb-2 grid gap-2 sm:grid-cols-3">
        <Input aria-label="Filter contacts" placeholder="Filter by name" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select aria-label="Filter by status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {contactStatuses.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </Select>
        <Select aria-label="Filter by company" value={company} onChange={(e) => setCompany(e.target.value)}>
          <option value="">All companies</option>
          {companies.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </Select>
      </div>
      {allTags.length > 0 && (
        <div role="group" aria-label="Select by tag" className="mb-2 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-sm text-zinc-600">Select by tag:</span>
          {allTags.map((t) => {
            const on = tagOn(t);
            return (
              <button
                key={t}
                type="button"
                aria-pressed={on}
                onClick={() => toggleTag(t)}
                className={`rounded-md px-2 py-0.5 text-xs font-medium ${
                  on ? "bg-violet-600 text-white" : "bg-violet-100 text-violet-800 hover:bg-violet-200"
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}
      <div className="mb-2 flex gap-3 text-sm">
        <button type="button" onClick={selectVisible} className="text-accent hover:underline">
          Select shown
        </button>
        <button type="button" onClick={() => onChange([])} className="text-zinc-600 hover:underline">
          Clear
        </button>
      </div>
      <ul className="max-h-56 divide-y divide-zinc-100 overflow-y-auto rounded-md border border-zinc-200 bg-white">
        {visible.map((c) => {
          const checked = selected.includes(c.id);
          return (
            <li key={c.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-zinc-50">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(c.id)}
                  className="size-4 accent-accent"
                />
                <span className="flex-1">
                  {fullName(c)}
                  {c.company && <span className="text-zinc-500"> · {c.company}</span>}
                  <span className="mt-1 block empty:hidden"><TagList tags={c.tags} /></span>
                </span>
                <span className="text-xs capitalize text-zinc-500">{c.status}</span>
              </label>
            </li>
          );
        })}
        {visible.length === 0 && <li className="px-3 py-2 text-sm text-zinc-500">No contacts match.</li>}
      </ul>
    </fieldset>
  );
}

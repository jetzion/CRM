"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui";

type Option = { id: string; name: string; version: number };

/** Chooses which template, if any, the outreach starts from. */
export function TemplatePicker({ templates, selectedId }: { templates: Option[]; selectedId?: string }) {
  const router = useRouter();
  return (
    <div className="mb-6 flex flex-wrap items-center gap-3">
      <label htmlFor="template-picker" className="text-sm font-medium text-zinc-700">Start from</label>
      <div className="w-full sm:w-80">
        <Select
          id="template-picker"
          value={selectedId ?? ""}
          onChange={(e) => router.push(e.target.value ? `/outreach?template=${e.target.value}` : "/outreach")}
        >
          <option value="">Scratch (no template)</option>
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} (version {t.version})
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

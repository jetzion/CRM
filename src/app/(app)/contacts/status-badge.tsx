import type { ContactStatus } from "@/lib/contacts";

const styles: Record<ContactStatus, { badge: string; dot: string }> = {
  lead: { badge: "bg-amber-100 text-amber-900 ring-amber-300", dot: "bg-amber-500" },
  active: { badge: "bg-sky-100 text-sky-900 ring-sky-300", dot: "bg-sky-500" },
  customer: { badge: "bg-emerald-100 text-emerald-900 ring-emerald-300", dot: "bg-emerald-500" },
  inactive: { badge: "bg-zinc-100 text-zinc-700 ring-zinc-300", dot: "bg-zinc-400" },
};

export function StatusBadge({ status }: { status: ContactStatus }) {
  const { badge, dot } = styles[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${badge}`}
    >
      <span aria-hidden className={`size-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  );
}

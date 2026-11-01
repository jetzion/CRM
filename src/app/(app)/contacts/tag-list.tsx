/** Row of tag chips; renders nothing when there are no tags. */
export function TagList({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <ul aria-label="Tags" className="flex flex-wrap gap-1">
      {tags.map((t) => (
        <li key={t} className="rounded-md bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-800">
          {t}
        </li>
      ))}
    </ul>
  );
}

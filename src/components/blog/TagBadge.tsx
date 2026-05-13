interface TagBadgeProps {
  name: string;
}

export default function TagBadge({ name }: TagBadgeProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors cursor-pointer">
      {name}
    </span>
  );
}

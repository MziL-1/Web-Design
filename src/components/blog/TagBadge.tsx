interface TagBadgeProps {
  name: string;
}

export default function TagBadge({ name }: TagBadgeProps) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs text-gray-600 bg-gray-50 border border-gray-200">
      {name}
    </span>
  );
}

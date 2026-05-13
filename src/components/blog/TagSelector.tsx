'use client';

import { useState, useEffect } from "react";
import TagBadge from "./TagBadge";

const PRESET_TAGS = [
  "JavaScript", "TypeScript", "React", "Next.js", "CSS",
  "Frontend", "Backend", "Fullstack", "Design", "Life",
  "Tutorial", "Opinion",
];

interface TagOption { id: string; name: string; }

interface TagSelectorProps {
  selectedTagIds: string[];
  onChange: (tagIds: string[]) => void;
}

export default function TagSelector({ selectedTagIds, onChange }: TagSelectorProps) {
  const [allTags, setAllTags] = useState<TagOption[]>([]);
  const [customInput, setCustomInput] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/tags")
      .then((r) => r.json())
      .then(setAllTags)
      .catch(() => {});
  }, []);

  const toggleTag = (tagId: string) => {
    if (selectedTagIds.includes(tagId)) {
      onChange(selectedTagIds.filter((id) => id !== tagId));
      setError("");
    } else if (selectedTagIds.length >= 6) {
      setError("最多选择 6 个标签");
    } else {
      onChange([...selectedTagIds, tagId]);
      setError("");
    }
  };

  const addCustomTag = async () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (trimmed.length > 30) { setError("标签名不能超过 30 个字符"); return; }
    if (selectedTagIds.length >= 6) { setError("最多选择 6 个标签"); return; }

    const res = await fetch("/api/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });

    if (res.ok) {
      const tag = await res.json();
      setAllTags((prev) => [...prev, tag]);
      onChange([...selectedTagIds, tag.id]);
      setCustomInput("");
      setError("");
    } else if (res.status === 409) {
      const found = allTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
      if (found) toggleTag(found.id);
      setCustomInput("");
    } else {
      const data = await res.json();
      setError(data.error || "添加失败");
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-zinc-700">标签 (最多 6 个)</label>
      <div className="flex flex-wrap gap-2">
        {allTags.map((tag) => (
          <button
            key={tag.id}
            type="button"
            onClick={() => toggleTag(tag.id)}
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium transition-all ${
              selectedTagIds.includes(tag.id)
                ? "bg-primary/10 text-primary ring-2 ring-primary"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustomTag(); } }}
          placeholder="添加自定义标签..."
          className="flex-1 px-3 py-1.5 text-sm border border-slate-300 rounded-md focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
        />
        <button
          type="button"
          onClick={addCustomTag}
          className="px-3 py-1.5 text-sm bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
        >
          添加
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

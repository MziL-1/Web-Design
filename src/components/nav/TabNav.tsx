'use client';

import { useAppStore, type ActiveTab } from "@/lib/store";

const tabs: { key: ActiveTab; label: string }[] = [
  { key: "discover", label: "发现博客" },
  { key: "following", label: "我的关注" },
];

export default function TabNav() {
  const activeTab = useAppStore((s) => s.activeTab);
  const setActiveTab = useAppStore((s) => s.setActiveTab);
  const activeIndex = tabs.findIndex((t) => t.key === activeTab);

  return (
    <div className="relative border-b border-zinc-200 mb-6">
      <nav className="flex gap-6" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative pb-3 text-sm font-medium transition-colors duration-200 ${
              activeTab === tab.key ? "text-primary" : "text-zinc-500 hover:text-zinc-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
      <div
        className="absolute bottom-0 h-0.5 bg-primary transition-transform duration-300 rounded-full"
        style={{ width: "64px", transform: `translateX(${activeIndex * 88}px)` }}
      />
    </div>
  );
}

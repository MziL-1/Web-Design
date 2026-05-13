"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import Link from "next/link";

export default function SearchBar() {
  const searchQuery = useAppStore((s) => s.searchQuery);
  const setSearchQuery = useAppStore((s) => s.setSearchQuery);
  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(localQuery), 300);
    return () => clearTimeout(timer);
  }, [localQuery]);

  useEffect(() => {
    abortRef.current?.abort();

    if (!debouncedQuery || debouncedQuery.length < 1) {
      setResults(null);
      setShowResults(false);
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data) => {
        if (!controller.signal.aborted) {
          setResults(data);
          setShowResults(true);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setLoading(false);
        }
      });
  }, [debouncedQuery]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { users = [], posts = [], tags = [] } = results || {};
  const isEmpty = results && users.length === 0 && posts.length === 0 && tags.length === 0;

  return (
    <div ref={containerRef} className="relative w-64">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={localQuery}
          onChange={(e) => { setLocalQuery(e.target.value); setSearchQuery(e.target.value); }}
          onFocus={() => results && setShowResults(true)}
          placeholder="搜索用户、文章、标签..."
          className="w-full pl-9 pr-3 py-2 text-sm border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-shadow"
        />
      </div>
      {showResults && (
        <div className="absolute top-full mt-1 w-80 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-4 bg-zinc-100 animate-pulse rounded w-3/4" />)}
            </div>
          ) : isEmpty ? (
            <div className="p-4 text-sm text-zinc-500 text-center">未找到结果，换个关键词试试</div>
          ) : (
            <div className="py-1">
              {users.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase">用户</div>
                  {users.map((u: any) => (
                    <Link key={u.id} href={`/${u.username}`} onClick={() => setShowResults(false)}
                      className="flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 transition-colors">
                      {u.avatarUrl && <img src={u.avatarUrl} alt="" className="w-6 h-6 rounded-full" />}
                      <div>
                        <span className="text-sm font-medium">{u.displayName}</span>
                        <span className="text-xs text-zinc-400 ml-1">@{u.username}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
              {posts.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase border-t border-zinc-100">文章</div>
                  {posts.map((p: any) => (
                    <Link key={p.id} href={`/${p.username}/${p.id}`} onClick={() => setShowResults(false)}
                      className="block px-3 py-2 hover:bg-zinc-50 transition-colors">
                      <span className="text-sm">{p.title}</span>
                      <span className="text-xs text-zinc-400 ml-2">@{p.username}</span>
                    </Link>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div>
                  <div className="px-3 py-1 text-xs font-medium text-zinc-400 uppercase border-t border-zinc-100">标签</div>
                  {tags.map((t: any) => (
                    <Link key={t.id} href={`/search?tag=${t.name}`} onClick={() => setShowResults(false)}
                      className="block px-3 py-2 hover:bg-zinc-50 transition-colors text-sm">
                      #{t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

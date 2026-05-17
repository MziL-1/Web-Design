"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Deployment {
  templateId: string;
  deployHookUrl: string;
  siteUrl: string | null;
  lastSyncAt: string | null;
  lastSyncStatus: "none" | "success" | "failed" | "pending";
  lastSyncError: string | null;
}

export default function DeployDashboardPage() {
  const router = useRouter();
  const [deployment, setDeployment] = useState<Deployment | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchDeployment = useCallback(async () => {
    const res = await fetch("/api/deployment");
    if (res.status === 401) {
      router.push("/login");
      return;
    }
    const data = await res.json();
    setDeployment(data);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchDeployment();
  }, [fetchDeployment]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch("/api/deployment/sync", { method: "POST" });
      const data = await res.json();
      setSyncResult(data.success ? "同步成功" : `同步失败：${data.error || "未知错误"}`);
      fetchDeployment();
    } catch {
      setSyncResult("同步请求失败，请检查网络");
    } finally {
      setSyncing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要取消部署吗？此操作不会删除 Vercel 上的项目。")) return;
    await fetch("/api/deployment", { method: "DELETE" });
    setDeployment(null);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center text-zinc-500">
        加载中...
      </div>
    );
  }

  if (!deployment) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <h2 className="text-xl font-display font-semibold text-zinc-900 mb-2">
          尚未部署
        </h2>
        <p className="text-zinc-500 text-sm mb-6">
          选择一个模板，一键部署你的独立博客
        </p>
        <button
          onClick={() => router.push("/templates")}
          className="inline-flex items-center px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors"
        >
          浏览模板
        </button>
      </div>
    );
  }

  const statusConfig = {
    success: { label: "同步成功", color: "text-green-600", bg: "bg-green-50" },
    failed: { label: "同步失败", color: "text-red-600", bg: "bg-red-50" },
    pending: { label: "同步中...", color: "text-blue-600", bg: "bg-blue-50" },
    none: { label: "尚未同步", color: "text-zinc-400", bg: "bg-zinc-50" },
  };

  const status = statusConfig[deployment.lastSyncStatus];

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="font-display text-2xl font-semibold text-zinc-900 mb-8">
        部署管理
      </h1>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 space-y-5">
        <div>
          <span className="text-xs text-zinc-400 uppercase tracking-wider">模板</span>
          <p className="text-zinc-900 font-medium mt-1">{deployment.templateId}</p>
        </div>

        <div>
          <span className="text-xs text-zinc-400 uppercase tracking-wider">网站地址</span>
          {deployment.siteUrl ? (
            <p className="mt-1">
              <a
                href={deployment.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline font-medium"
              >
                {deployment.siteUrl}
              </a>
            </p>
          ) : (
            <p className="text-zinc-400 mt-1">未设置</p>
          )}
        </div>

        <div>
          <span className="text-xs text-zinc-400 uppercase tracking-wider">同步状态</span>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${status.bg} rounded-full text-xs font-medium ${status.color}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status.color.replace("text-", "bg-")}`} />
              {status.label}
            </span>
            {deployment.lastSyncAt && (
              <span className="text-xs text-zinc-400">
                {new Date(deployment.lastSyncAt).toLocaleString("zh-CN")}
              </span>
            )}
          </div>
          {deployment.lastSyncStatus === "failed" && deployment.lastSyncError && (
            <p className="text-xs text-red-500 mt-2">{deployment.lastSyncError}</p>
          )}
        </div>

        {syncResult && (
          <div className={`text-sm px-3 py-2 rounded-lg ${
            syncResult.includes("成功") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
          }`}>
            {syncResult}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {syncing ? "同步中..." : "立即同步"}
          </button>
          <button
            onClick={handleDelete}
            className="px-4 py-2 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
          >
            取消部署
          </button>
        </div>
      </div>
    </div>
  );
}

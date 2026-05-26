"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { TEMPLATES } from "@/lib/templates";

interface Deployment {
  templateId: string;
  deployHookUrl: string;
  siteUrl: string | null;
  vercelProjectId?: string | null;
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
  const [showSetup, setShowSetup] = useState(false);
  const [showAutoDeploy, setShowAutoDeploy] = useState(false);
  const [form, setForm] = useState({ templateId: "", deployHookUrl: "", siteUrl: "" });
  const [submitting, setSubmitting] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);
  const [autoToken, setAutoToken] = useState("");
  const [autoTemplate, setAutoTemplate] = useState("minimal-blog");
  const [autoDeploying, setAutoDeploying] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [fixingHook, setFixingHook] = useState(false);
  const [fixToken, setFixToken] = useState("");
  const [fixError, setFixError] = useState<string | null>(null);
  const [showFixHook, setShowFixHook] = useState(false);

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

  const handleAutoDeploy = async () => {
    setAutoDeploying(true);
    setAutoError(null);
    try {
      const res = await fetch("/api/deployment/auto-deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: autoTemplate, vercelToken: autoToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeployment(data.deployment);
        setShowAutoDeploy(false);
        setAutoToken("");
      } else {
        setAutoError(data.error || "部署失败");
      }
    } catch {
      setAutoError("网络错误，请稍后重试");
    } finally {
      setAutoDeploying(false);
    }
  };

  const handleSubmitSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSetupError(null);

    try {
      const res = await fetch("/api/deployment", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: form.templateId,
          deployHookUrl: form.deployHookUrl,
          siteUrl: form.siteUrl || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setSetupError(data.error || "配置失败");
        return;
      }

      const data = await res.json();
      setDeployment(data);
      setShowSetup(false);
    } catch {
      setSetupError("网络错误，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

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

  const handleFixHook = async () => {
    setFixingHook(true);
    setFixError(null);
    try {
      const res = await fetch("/api/deployment/fix-hook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: fixToken }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeployment(data);
        setShowFixHook(false);
        setFixToken("");
        setSyncResult("部署 Token 已更新");
      } else {
        setFixError(data.error || "修复失败");
      }
    } catch {
      setFixError("网络错误");
    } finally {
      setFixingHook(false);
    }
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
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h1 className="font-display text-2xl font-semibold text-zinc-900 mb-8">
          部署管理
        </h1>

        {!showSetup && !showAutoDeploy ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3" />
              </svg>
            </div>
            <h2 className="text-xl font-display font-semibold text-zinc-900 mb-2">
              尚未部署
            </h2>
            <p className="text-zinc-500 text-sm mb-6">
              一键部署你的独立博客，只需一个 Vercel Token
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <button
                onClick={() => setShowAutoDeploy(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-900 text-white text-sm font-semibold rounded-full hover:bg-zinc-800 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
                </svg>
                一键部署
              </button>
              <button
                onClick={() => setShowSetup(true)}
                className="inline-flex items-center px-5 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
              >
                手动配置
              </button>
            </div>
          </div>
        ) : showAutoDeploy ? (
          <div className="bg-white border border-zinc-200 rounded-xl p-6 max-w-lg mx-auto">
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-1">
              一键部署
            </h2>
            <p className="text-zinc-500 text-sm mb-6">
              填一个 Token，30 秒上线你的独立博客
            </p>

            {/* Pre-requisite checklist */}
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm">
              <p className="font-semibold text-amber-800 mb-2">部署前确认</p>
              <ol className="space-y-2 text-amber-700">
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-[11px] font-bold">1</span>
                  <span>
                    有{' '}
                    <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">Vercel</a>
                    {' '}账号（推荐用 GitHub 注册）
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-[11px] font-bold">2</span>
                  <span>
                    <strong>Vercel 已连接 GitHub：</strong>
                    {' '}
                    <a href="https://vercel.com/dashboard/settings/integrations" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                      Settings → Integrations → GitHub → Connect
                    </a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="shrink-0 mt-0.5 w-5 h-5 bg-amber-200 text-amber-800 rounded-full flex items-center justify-center text-[11px] font-bold">3</span>
                  <span>
                    创建{' '}
                    <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                      Vercel Access Token
                    </a>
                    {' '}（Full Account 权限）
                  </span>
                </li>
              </ol>
            </div>

            {!autoToken && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                第 2 步最容易被忽略——没有 GitHub 授权，Vercel 无法克隆模板仓库，会导致部署的项目为空。
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  选择模板
                </label>
                <select
                  value={autoTemplate}
                  onChange={(e) => setAutoTemplate(e.target.value)}
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm bg-white focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                >
                  {TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Vercel Access Token
                </label>
                <input
                  type="password"
                  value={autoToken}
                  onChange={(e) => setAutoToken(e.target.value)}
                  placeholder="粘贴你的 Vercel Token..."
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
                <p className="mt-1.5 text-xs text-zinc-400">
                  从{' '}
                  <a href="https://vercel.com/account/tokens" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    vercel.com/account/tokens
                  </a>
                  {' '}创建，选 Full Account 权限。Token 只用于本次创建项目，不会明文存储。
                </p>
              </div>

              {autoError && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {autoError}
                </div>
              )}

              <div className="flex gap-3 pt-2 flex-wrap">
                <button
                  onClick={handleAutoDeploy}
                  disabled={autoDeploying || !autoToken.trim()}
                  className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {autoDeploying ? "部署中..." : "开始部署"}
                </button>
                <button
                  onClick={() => { setShowAutoDeploy(false); setAutoToken(""); setAutoError(null); }}
                  className="px-5 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
                >
                  返回
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-zinc-200 rounded-xl p-6 max-w-lg mx-auto">
            <h2 className="font-display text-lg font-semibold text-zinc-900 mb-4">
              手动配置部署
            </h2>

            <form onSubmit={handleSubmitSetup} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  模板标识
                </label>
                <input
                  type="text"
                  value={form.templateId}
                  onChange={(e) => setForm({ ...form, templateId: e.target.value })}
                  placeholder="如 minimal-blog、portfolio"
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  Vercel Deploy Hook URL
                </label>
                <input
                  type="text"
                  value={form.deployHookUrl}
                  onChange={(e) => setForm({ ...form, deployHookUrl: e.target.value })}
                  placeholder="https://api.vercel.com/v1/integrations/deploy/..."
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                  网站地址 <span className="text-zinc-400 font-normal">(可选)</span>
                </label>
                <input
                  type="text"
                  value={form.siteUrl}
                  onChange={(e) => setForm({ ...form, siteUrl: e.target.value })}
                  placeholder="https://your-site.vercel.app"
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
              </div>

              {setupError && (
                <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                  {setupError}
                </div>
              )}

              <div className="flex gap-3 pt-2 flex-wrap">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "保存中..." : "保存配置"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowSetup(false)}
                  className="px-5 py-2.5 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
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

        <div className="flex gap-3 pt-2 flex-wrap">
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

        {deployment.lastSyncStatus === "failed" && (
          <div className="pt-3 border-t border-zinc-100">
            {!showFixHook ? (
              <button
                onClick={() => setShowFixHook(true)}
                className="px-4 py-2 border border-amber-300 text-amber-700 text-sm font-medium rounded-full hover:bg-amber-50 transition-colors"
              >
                 修复部署 Token
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-zinc-600">输入 Vercel Token 更新同步凭证</p>
                <input
                  type="password"
                  value={fixToken}
                  onChange={(e) => setFixToken(e.target.value)}
                  placeholder="粘贴 Vercel Token..."
                  className="w-full px-4 py-2.5 border border-zinc-300 rounded-lg text-sm focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900"
                />
                {fixError && (
                  <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{fixError}</div>
                )}
                <div className="flex gap-3">
                  <button
                    onClick={handleFixHook}
                    disabled={fixingHook || !fixToken.trim()}
                    className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 disabled:opacity-50 transition-colors"
                  >
                    {fixingHook ? "修复中..." : "确认修复"}
                  </button>
                  <button
                    onClick={() => { setShowFixHook(false); setFixToken(""); setFixError(null); }}
                    className="px-4 py-2 border border-zinc-300 text-zinc-700 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

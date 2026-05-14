"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const body = {
      username: (form.get("username") as string).toLowerCase(),
      email: form.get("email") as string,
      password: form.get("password") as string,
    };

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (res.ok) {
      router.push(`/login?registered=true`);
    } else {
      const data = await res.json();
      setError(data.error ?? "注册失败");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
    <div className="mx-auto mt-20 max-w-sm">
      <h1 className="mb-6 text-center text-2xl font-bold">创建账号</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="mb-1 block text-sm font-medium">
            用户名 (URL路径)
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            minLength={3}
            maxLength={30}
            pattern="[a-z0-9_-]+"
            placeholder="your-name"
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <p className="mt-1 text-xs text-neutral-muted">
            3-30个小写字母、数字、下划线或连字符
          </p>
        </div>

        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">邮箱</label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">密码</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            className="w-full rounded-md border border-slate-300 px-3 py-2 text-base outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {error && (
          <div className="rounded-md bg-error/10 p-3 text-sm text-error">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="h-10 w-full rounded-lg bg-primary font-medium text-white hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "注册中..." : "注册"}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-neutral-muted">
        已有账号？{" "}
        <Link href="/login" className="text-primary hover:underline">登录</Link>
      </p>
    </div>
    </div>
  );
}

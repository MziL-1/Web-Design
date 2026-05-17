# Template Deployment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build template deployment system — users pick a blog template, one-click deploy to Vercel, auto-sync articles.

**Architecture:** Public API (read-only, rate-limited) serves profile+posts data. Deploy hooks trigger Vercel rebuilds. `triggerDeploy()` syncs on content/profile changes. `SiteDeployment` model stores deploy config and sync status.

**Tech Stack:** Next.js 15 App Router, Prisma SQLite, TypeScript, Tailwind CSS, Vitest

**Design doc:** `design-v3-template-deploy.md`

---

## File Map

**Create:**
| File | Responsibility |
|------|---------------|
| `src/lib/sync.ts` | `triggerDeploy(userId)` — POST Vercel deploy hook + update sync status |
| `src/lib/templates.ts` | Template catalog (id, name, description, repo, screenshot) |
| `src/app/api/public/profile/[username]/route.ts` | `GET` — public profile data (rate-limited) |
| `src/app/api/public/posts/[username]/route.ts` | `GET` — published posts list (rate-limited) |
| `src/app/api/public/posts/[username]/[postId]/route.ts` | `GET` — single post with full Markdown (rate-limited) |
| `src/app/api/deployment/route.ts` | `PUT` create/update, `GET` read, `DELETE` cancel deployment |
| `src/app/api/deployment/sync/route.ts` | `POST` manual sync trigger |
| `src/app/(main)/templates/page.tsx` | Template marketplace page |
| `src/app/(main)/templates/[id]/page.tsx` | Template detail + deploy guide |
| `src/app/(main)/dashboard/deploy/page.tsx` | Deployment status dashboard |
| `src/__tests__/api/public.test.ts` | Public API tests |
| `src/__tests__/lib/sync.test.ts` | triggerDeploy tests |
| `src/__tests__/api/deployment.test.ts` | Deployment API tests |

**Modify:**
| File | Change |
|------|--------|
| `prisma/schema.prisma` | Add `SiteDeployment` model |
| `src/lib/rate-limit.ts` | Add `public_read` limit (60/min) |
| `src/app/api/posts/route.ts` | Add `triggerDeploy()` after POST |
| `src/app/api/posts/[id]/route.ts` | Add `triggerDeploy()` after PUT + DELETE |
| `src/app/api/profile/route.ts` | Add `triggerDeploy()` after PUT |
| `src/components/NavBar.tsx` | Add 「模板市场」+ dashboard links |

---

### Task 1: Prisma Schema — Add SiteDeployment model

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Add SiteDeployment model to schema**

```prisma
model SiteDeployment {
  id             String    @id @default(cuid())
  userId         String
  user           User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  templateId     String
  deployHookUrl  String
  siteUrl        String?
  lastSyncAt     DateTime?
  lastSyncStatus String    @default("none")
  lastSyncError  String?
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt

  @@unique([userId])
}
```

- [ ] **Step 2: Push schema to DB**

```bash
npx prisma db push
```

Expected: "Your database is now in sync with your schema."

- [ ] **Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat: add SiteDeployment model for template deploy tracking"
```

---

### Task 2: Rate Limit — Add public_read action

**Files:**
- Modify: `src/lib/rate-limit.ts`

- [ ] **Step 1: Add public_read to rate limit config**

Open `src/lib/rate-limit.ts`, add `public_read` entry to the `LIMITS` object:

```ts
const LIMITS: Record<string, { count: number; windowSec: number }> = {
  comment: { count: 5, windowSec: 60 },
  register: { count: 3, windowSec: 3600 },
  import: { count: 10, windowSec: 60 },
  public_read: { count: 60, windowSec: 60 },
};
```

- [ ] **Step 2: Verify**

Run: `npx tsc --noEmit`
Expected: No type errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/rate-limit.ts
git commit -m "feat: add public_read rate limit (60 req/min) for public API"
```

---

### Task 3: Public API — Profile endpoint

**Files:**
- Create: `src/app/api/public/profile/[username]/route.ts`
- Test: `src/__tests__/api/public.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/api/public.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  user: { findUnique: vi.fn() },
  profile: { findUnique: vi.fn() },
  post: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn().mockResolvedValue(true) }));

describe("GET /api/public/profile/[username]", () => {
  it("returns profile data for existing user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      username: "alice",
      profile: {
        displayName: "Alice",
        bio: "A developer blog",
        avatarUrl: "https://example.com/avatar.jpg",
        tags: [{ tag: { id: "t1", name: "JavaScript" } }],
      },
    });

    const { GET } = await import("@/app/api/public/profile/[username]/route");
    const req = new Request("http://localhost/api/public/profile/alice");
    const res = await GET(req, { params: Promise.resolve({ username: "alice" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.displayName).toBe("Alice");
    expect(body.tags).toEqual(["JavaScript"]);
  });

  it("returns 404 for non-existent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/public/profile/[username]/route");
    const req = new Request("http://localhost/api/public/profile/nobody");
    const res = await GET(req, { params: Promise.resolve({ username: "nobody" }) });

    expect(res.status).toBe(404);
  });

  it("returns cache-control header", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      username: "alice",
      profile: {
        displayName: "Alice",
        bio: null,
        avatarUrl: null,
        tags: [],
      },
    });

    const { GET } = await import("@/app/api/public/profile/[username]/route");
    const req = new Request("http://localhost/api/public/profile/alice");
    const res = await GET(req, { params: Promise.resolve({ username: "alice" }) });

    expect(res.headers.get("Cache-Control")).toContain("s-maxage=60");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/__tests__/api/public.test.ts
```

Expected: FAIL — module not found (files not created yet).

- [ ] **Step 3: Implement the profile route**

Create `src/app/api/public/profile/[username]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const allowed = await checkRateLimit(ip, "public_read");
  if (!allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      profile: {
        include: { tags: { include: { tag: true } } },
      },
    },
  });

  if (!user || !user.profile) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  return NextResponse.json(
    {
      username: user.username,
      displayName: user.profile.displayName,
      bio: user.profile.bio,
      avatarUrl: user.profile.avatarUrl,
      tags: user.profile.tags.map((pt) => pt.tag.name),
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx vitest run src/__tests__/api/public.test.ts
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/public/profile/[username]/route.ts src/__tests__/api/public.test.ts
git commit -m "feat: add public profile API with rate limit and cache headers"
```

---

### Task 4: Public API — Posts list endpoint

**Files:**
- Create: `src/app/api/public/posts/[username]/route.ts`
- Modify: `src/__tests__/api/public.test.ts`

- [ ] **Step 1: Add failing tests for posts list**

Append to `src/__tests__/api/public.test.ts`:

```ts
describe("GET /api/public/posts/[username]", () => {
  it("returns published posts for existing user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      posts: [
        {
          id: "p1",
          title: "My First Post",
          content: "# Hello\nWorld",
          coverImage: "https://example.com/cover.jpg",
          createdAt: new Date("2026-01-01"),
          tags: [{ tag: { id: "t1", name: "TypeScript" } }],
        },
      ],
    });

    const { GET } = await import("@/app/api/public/posts/[username]/route");
    const req = new Request("http://localhost/api/public/posts/alice");
    const res = await GET(req, { params: Promise.resolve({ username: "alice" }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0].title).toBe("My First Post");
    expect(body[0].content).toBeUndefined(); // list doesn't include full content
    expect(body[0].tags).toEqual(["TypeScript"]);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=60");
  });

  it("returns 404 for non-existent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/public/posts/[username]/route");
    const req = new Request("http://localhost/api/public/posts/nobody");
    const res = await GET(req, { params: Promise.resolve({ username: "nobody" }) });

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/api/public.test.ts
```

Expected: FAIL — module not found for posts route.

- [ ] **Step 3: Implement the posts list route**

Create `src/app/api/public/posts/[username]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const allowed = await checkRateLimit(ip, "public_read");
  if (!allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const { username } = await params;

  const user = await prisma.user.findUnique({
    where: { username },
    include: {
      posts: {
        where: { published: true },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          coverImage: true,
          createdAt: true,
          tags: { include: { tag: true } },
        },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const posts = user.posts.map((post) => ({
    id: post.id,
    title: post.title,
    coverImage: post.coverImage,
    createdAt: post.createdAt,
    tags: post.tags.map((pt) => pt.tag.name),
  }));

  return NextResponse.json(posts, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/api/public.test.ts
```

Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/public/posts/[username]/route.ts src/__tests__/api/public.test.ts
git commit -m "feat: add public posts list API with rate limit"
```

---

### Task 5: Public API — Single post endpoint

**Files:**
- Create: `src/app/api/public/posts/[username]/[postId]/route.ts`
- Modify: `src/__tests__/api/public.test.ts`

- [ ] **Step 1: Add failing tests for single post**

Append to `src/__tests__/api/public.test.ts`:

```ts
describe("GET /api/public/posts/[username]/[postId]", () => {
  it("returns full post content for published post", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.post.findFirst.mockResolvedValueOnce({
      id: "p1",
      title: "My First Post",
      content: "# Hello\nWorld",
      coverImage: "https://example.com/cover.jpg",
      createdAt: new Date("2026-01-01"),
      user: { username: "alice" },
    });

    const { GET } = await import("@/app/api/public/posts/[username]/[postId]/route");
    const req = new Request("http://localhost/api/public/posts/alice/p1");
    const res = await GET(req, {
      params: Promise.resolve({ username: "alice", postId: "p1" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.title).toBe("My First Post");
    expect(body.content).toBe("# Hello\nWorld");
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=60");
  });

  it("returns 404 for unpublished post", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: "u1" });
    mockPrisma.post.findFirst.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/public/posts/[username]/[postId]/route");
    const req = new Request("http://localhost/api/public/posts/alice/draft");
    const res = await GET(req, {
      params: Promise.resolve({ username: "alice", postId: "draft" }),
    });

    expect(res.status).toBe(404);
  });

  it("returns 404 for non-existent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/public/posts/[username]/[postId]/route");
    const req = new Request("http://localhost/api/public/posts/nobody/p1");
    const res = await GET(req, {
      params: Promise.resolve({ username: "nobody", postId: "p1" }),
    });

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/api/public.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement the single post route**

Create `src/app/api/public/posts/[username]/[postId]/route.ts`:

```ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { headers } from "next/headers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string; postId: string }> }
) {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "127.0.0.1";

  const allowed = await checkRateLimit(ip, "public_read");
  if (!allowed) {
    return NextResponse.json({ error: "请求过于频繁" }, { status: 429 });
  }

  const { username, postId } = await params;

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "用户不存在" }, { status: 404 });
  }

  const post = await prisma.post.findFirst({
    where: { id: postId, userId: user.id, published: true },
    select: {
      id: true,
      title: true,
      content: true,
      coverImage: true,
      createdAt: true,
      user: { select: { username: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "文章不存在" }, { status: 404 });
  }

  return NextResponse.json(post, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
    },
  });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/api/public.test.ts
```

Expected: 8 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/public/posts/[username]/[postId]/route.ts src/__tests__/api/public.test.ts
git commit -m "feat: add public single post API with Markdown content"
```

---

### Task 6: Sync Module — triggerDeploy function

**Files:**
- Create: `src/lib/sync.ts`
- Create: `src/__tests__/lib/sync.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/lib/sync.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDeployment = {
  id: "d1",
  userId: "u1",
  deployHookUrl: "https://api.vercel.com/v1/integrations/deploy/hook123",
  lastSyncStatus: "success",
};

const mockPrisma = {
  siteDeployment: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("triggerDeploy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("POSTs deploy hook and updates status to success", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.vercel.com/v1/integrations/deploy/hook123",
      expect.objectContaining({ method: "POST" })
    );
    expect(mockPrisma.siteDeployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
        data: expect.objectContaining({
          lastSyncStatus: "success",
          lastSyncError: null,
        }),
      })
    );
  });

  it("does nothing when user has no deployment", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(null);

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPrisma.siteDeployment.update).not.toHaveBeenCalled();
  });

  it("records failure status on network error", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1");

    expect(mockPrisma.siteDeployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
        data: expect.objectContaining({
          lastSyncStatus: "failed",
          lastSyncError: "Network error",
        }),
      })
    );
  });

  it("records failure on non-ok response", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1");

    expect(mockPrisma.siteDeployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastSyncStatus: "failed" }),
      })
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/lib/sync.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement triggerDeploy**

Create `src/lib/sync.ts`:

```ts
import { prisma } from "@/lib/prisma";

export async function triggerDeploy(userId: string) {
  const deployment = await prisma.siteDeployment.findUnique({
    where: { userId },
  });

  if (!deployment) return;

  try {
    const res = await fetch(deployment.deployHookUrl, {
      method: "POST",
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      throw new Error(`Vercel responded ${res.status}`);
    }

    await prisma.siteDeployment.update({
      where: { userId },
      data: {
        lastSyncAt: new Date(),
        lastSyncStatus: "success",
        lastSyncError: null,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await prisma.siteDeployment.update({
      where: { userId },
      data: {
        lastSyncStatus: "failed",
        lastSyncError: message,
      },
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/lib/sync.test.ts
```

Expected: 4 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/sync.ts src/__tests__/lib/sync.test.ts
git commit -m "feat: add triggerDeploy with sync status tracking"
```

---

### Task 7: Deployment API — CRUD

**Files:**
- Create: `src/app/api/deployment/route.ts`
- Create: `src/__tests__/api/deployment.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/__tests__/api/deployment.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDeployment = {
  id: "d1",
  userId: "u1",
  templateId: "minimal-blog",
  deployHookUrl: "https://api.vercel.com/v1/integrations/deploy/hook123",
  siteUrl: "https://my-blog.vercel.app",
  lastSyncAt: null,
  lastSyncStatus: "none",
  lastSyncError: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTriggerDeploy = vi.fn();

const mockPrisma = {
  siteDeployment: {
    findUnique: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "u1", username: "alice" } }),
}));
vi.mock("@/lib/sync", () => ({ triggerDeploy: mockTriggerDeploy }));

describe("PUT /api/deployment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates deployment for authenticated user", async () => {
    mockPrisma.siteDeployment.upsert.mockResolvedValueOnce(mockDeployment);

    const { PUT } = await import("@/app/api/deployment/route");
    const req = new Request("http://localhost/api/deployment", {
      method: "PUT",
      body: JSON.stringify({
        templateId: "minimal-blog",
        deployHookUrl: "https://api.vercel.com/v1/integrations/deploy/hook123",
        siteUrl: "https://my-blog.vercel.app",
      }),
    });
    const res = await PUT(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.templateId).toBe("minimal-blog");
    expect(mockPrisma.siteDeployment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
      })
    );
  });

  it("returns 401 for unauthenticated user", async () => {
    const authMod = await import("@/lib/auth");
    (authMod.auth as any).mockResolvedValueOnce(null);

    const { PUT } = await import("@/app/api/deployment/route");
    const req = new Request("http://localhost/api/deployment", {
      method: "PUT",
      body: JSON.stringify({ templateId: "minimal-blog", deployHookUrl: "https://..." }),
    });
    const res = await PUT(req);

    expect(res.status).toBe(401);
  });

  it("validates required fields on PUT", async () => {
    const { PUT } = await import("@/app/api/deployment/route");
    const req = new Request("http://localhost/api/deployment", {
      method: "PUT",
      body: JSON.stringify({}),
    });
    const res = await PUT(req);

    expect(res.status).toBe(400);
  });
});

describe("GET /api/deployment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns deployment for authenticated user", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);

    const { GET } = await import("@/app/api/deployment/route");
    const req = new Request("http://localhost/api/deployment");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.templateId).toBe("minimal-blog");
    expect(body.lastSyncStatus).toBe("none");
  });

  it("returns null when user has no deployment", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/deployment/route");
    const req = new Request("http://localhost/api/deployment");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toBeNull();
  });
});

describe("DELETE /api/deployment", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes deployment for authenticated user", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
    mockPrisma.siteDeployment.delete.mockResolvedValueOnce(mockDeployment);

    const { DELETE } = await import("@/app/api/deployment/route");
    const req = new Request("http://localhost/api/deployment", { method: "DELETE" });
    const res = await DELETE(req);

    expect(res.status).toBe(200);
    expect(mockPrisma.siteDeployment.delete).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "u1" } })
    );
  });

  it("returns 404 when no deployment exists", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(null);

    const { DELETE } = await import("@/app/api/deployment/route");
    const req = new Request("http://localhost/api/deployment", { method: "DELETE" });
    const res = await DELETE(req);

    expect(res.status).toBe(404);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/api/deployment.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement deployment CRUD route**

Create `src/app/api/deployment/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const body = await request.json();

  if (!body.templateId || typeof body.templateId !== "string") {
    return NextResponse.json({ error: "缺少templateId" }, { status: 400 });
  }

  if (!body.deployHookUrl || typeof body.deployHookUrl !== "string") {
    return NextResponse.json({ error: "缺少deployHookUrl" }, { status: 400 });
  }

  if (!body.deployHookUrl.startsWith("https://api.vercel.com/")) {
    return NextResponse.json(
      { error: "deployHookUrl必须是Vercel deploy hook URL" },
      { status: 400 }
    );
  }

  const deployment = await prisma.siteDeployment.upsert({
    where: { userId: session.user.id },
    update: {
      templateId: body.templateId,
      deployHookUrl: body.deployHookUrl,
      siteUrl: typeof body.siteUrl === "string" ? body.siteUrl : null,
    },
    create: {
      userId: session.user.id,
      templateId: body.templateId,
      deployHookUrl: body.deployHookUrl,
      siteUrl: typeof body.siteUrl === "string" ? body.siteUrl : null,
    },
  });

  return NextResponse.json(deployment);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const deployment = await prisma.siteDeployment.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(deployment);
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const existing = await prisma.siteDeployment.findUnique({
    where: { userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "没有部署记录" }, { status: 404 });
  }

  await prisma.siteDeployment.delete({
    where: { userId: session.user.id },
  });

  return NextResponse.json({ success: true });
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/api/deployment.test.ts
```

Expected: 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/deployment/route.ts src/__tests__/api/deployment.test.ts
git commit -m "feat: add deployment CRUD API (PUT/GET/DELETE)"
```

---

### Task 8: Deployment API — Manual sync

**Files:**
- Create: `src/app/api/deployment/sync/route.ts`
- Modify: `src/__tests__/api/deployment.test.ts`

- [ ] **Step 1: Add failing tests for manual sync**

Append to `src/__tests__/api/deployment.test.ts`:

```ts
describe("POST /api/deployment/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers deploy and returns success", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
    mockTriggerDeploy.mockResolvedValueOnce(undefined);
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce({
      ...mockDeployment,
      lastSyncStatus: "success",
    });

    const { POST } = await import("@/app/api/deployment/sync/route");
    const req = new Request("http://localhost/api/deployment/sync", {
      method: "POST",
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.success).toBe(true);
    expect(mockTriggerDeploy).toHaveBeenCalledWith("u1");
  });

  it("returns 404 when user has no deployment", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/deployment/sync/route");
    const req = new Request("http://localhost/api/deployment/sync", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    expect(mockTriggerDeploy).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/__tests__/api/deployment.test.ts
```

Expected: FAIL — module not found for sync route.

- [ ] **Step 3: Implement manual sync route**

Create `src/app/api/deployment/sync/route.ts`:

```ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { triggerDeploy } from "@/lib/sync";
import { prisma } from "@/lib/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "未登录" }, { status: 401 });
  }

  const deployment = await prisma.siteDeployment.findUnique({
    where: { userId: session.user.id },
  });

  if (!deployment) {
    return NextResponse.json({ error: "未配置部署" }, { status: 404 });
  }

  try {
    await triggerDeploy(session.user.id);

    const updated = await prisma.siteDeployment.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json({
      success: updated?.lastSyncStatus === "success",
      status: updated?.lastSyncStatus,
      error: updated?.lastSyncError,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "同步请求失败" },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/__tests__/api/deployment.test.ts
```

Expected: 9 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/deployment/sync/route.ts src/__tests__/api/deployment.test.ts
git commit -m "feat: add manual sync endpoint for deployment"
```

---

### Task 9: Integrate triggerDeploy — POST /api/posts

**Files:**
- Modify: `src/app/api/posts/route.ts`

- [ ] **Step 1: Add triggerDeploy call after post creation**

In `src/app/api/posts/route.ts`, add the import and call:

At top of file, add:
```ts
import { triggerDeploy } from "@/lib/sync";
```

At the end of the `POST` function, just before `return NextResponse.json(post, { status: 201 })`, add:
```ts
  triggerDeploy(session.user.id);
```

The full POST function after modification (update return):

```ts
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "未登录" }, { status: 401 });

  const body = await request.json();

  const titleErr = validateField(body.title, "标题", 1, 200);
  if (titleErr) return NextResponse.json({ error: titleErr }, { status: 400 });

  if (typeof body.content === "string" && body.content.length > 50000) {
    return NextResponse.json({ error: "文章内容不能超过50000字符" }, { status: 400 });
  }

  const post = await prisma.post.create({
    data: {
      title: body.title,
      content: body.content ?? "",
      coverImage:
        typeof body.coverImage === "string" && body.coverImage
          ? body.coverImage
          : extractFirstImage(body.content ?? ""),
      published: body.published ?? true,
      userId: session.user.id,
    },
  });

  if (body.published !== false) {
    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { sitePublished: true },
    });
    if (profile && !profile.sitePublished) {
      await prisma.profile.update({
        where: { userId: session.user.id },
        data: { sitePublished: true },
      });
    }
  }

  triggerDeploy(session.user.id);

  return NextResponse.json(post, { status: 201 });
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/posts/route.ts
git commit -m "feat: trigger deploy sync on post creation"
```

---

### Task 10: Integrate triggerDeploy — PUT/DELETE /api/posts/[id]

**Files:**
- Modify: `src/app/api/posts/[id]/route.ts`

- [ ] **Step 1: Add triggerDeploy after PUT and DELETE**

In `src/app/api/posts/[id]/route.ts`, add import at top:
```ts
import { triggerDeploy } from "@/lib/sync";
```

In the `PUT` function, add after `return NextResponse.json(updated)` → change to:
```ts
  const updated = await prisma.post.update({
    where: { id },
    data,
  });

  triggerDeploy(session.user.id);

  return NextResponse.json(updated);
```

In the `DELETE` function, add after `await prisma.post.delete({ where: { id } })` → change to:
```ts
  await prisma.post.delete({ where: { id } });

  triggerDeploy(session.user.id);

  return NextResponse.json({ success: true });
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/posts/[id]/route.ts
git commit -m "feat: trigger deploy sync on post edit and delete"
```

---

### Task 11: Integrate triggerDeploy — PUT /api/profile

**Files:**
- Modify: `src/app/api/profile/route.ts`

- [ ] **Step 1: Add triggerDeploy after profile update**

In `src/app/api/profile/route.ts`, add import at top:
```ts
import { triggerDeploy } from "@/lib/sync";
```

In the `PUT` function, add after the tag update block (before `return NextResponse.json(profile)`) → change to:
```ts
    }

    triggerDeploy(session.user.id);

    return NextResponse.json(profile);
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/profile/route.ts
git commit -m "feat: trigger deploy sync on profile update"
```

---

### Task 12: Template Config

**Files:**
- Create: `src/lib/templates.ts`

- [ ] **Step 1: Create template catalog**

Create `src/lib/templates.ts`:

```ts
export interface Template {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  demoUrl: string;
  repoUrl: string;
  tags: string[];
  features: string[];
}

export const TEMPLATES: Template[] = [
  {
    id: "minimal-blog",
    name: "极简技术博客",
    description: "白底黑字，极简排版，专注阅读体验。适合技术博客和写作。",
    thumbnail: "/templates/minimal-blog.png",
    demoUrl: "https://minimal-blog-demo.vercel.app",
    repoUrl: "https://github.com/MziL-1/blog-template-minimal",
    tags: ["博客", "极简", "技术"],
    features: [
      "SSG 静态生成，SEO 友好",
      "RSS Feed 自动生成",
      "响应式设计，移动端适配",
      "Cormorant Garamond + Inter 字体",
    ],
  },
  {
    id: "portfolio",
    name: "开发者作品集",
    description: "带项目展示区的作品集风格模板，展示你的项目和文章。",
    thumbnail: "/templates/portfolio.png",
    demoUrl: "https://portfolio-demo.vercel.app",
    repoUrl: "https://github.com/MziL-1/blog-template-portfolio",
    tags: ["作品集", "项目展示"],
    features: [
      "项目卡片展示区",
      "文章列表 + 详情页",
      "响应式设计",
      "SSG 静态生成",
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return TEMPLATES.find((t) => t.id === id);
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/templates.ts
git commit -m "feat: add template catalog config with 2 templates"
```

---

### Task 13: Template Market Page

**Files:**
- Create: `src/app/(main)/templates/page.tsx`

- [ ] **Step 1: Create template market page**

Create `src/app/(main)/templates/page.tsx`:

```tsx
import Link from "next/link";
import type { Metadata } from "next";
import { TEMPLATES } from "@/lib/templates";

export const metadata: Metadata = {
  title: "模板市场 — 选择你的博客模板",
  description: "浏览精美的博客模板，一键部署到 Vercel",
};

export default function TemplatesPage() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-semibold text-zinc-900 mb-3">
          模板市场
        </h1>
        <p className="text-zinc-500 text-base">
          选择一个模板，一键部署属于你自己的独立博客
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {TEMPLATES.map((template) => (
          <Link
            key={template.id}
            href={`/templates/${template.id}`}
            className="group block bg-white border border-zinc-200 rounded-xl overflow-hidden hover:border-zinc-400 hover:shadow-md transition-all"
          >
            <div className="aspect-video bg-zinc-100 flex items-center justify-center text-zinc-400 text-sm">
              {template.thumbnail ? (
                <img
                  src={template.thumbnail}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>预览图</span>
              )}
            </div>
            <div className="p-5">
              <h2 className="font-display text-xl font-semibold text-zinc-900 mb-2 group-hover:text-zinc-700 transition-colors">
                {template.name}
              </h2>
              <p className="text-zinc-500 text-sm mb-3">{template.description}</p>
              <div className="flex flex-wrap gap-2">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-0.5 bg-zinc-100 text-zinc-600 text-xs rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/templates/page.tsx
git commit -m "feat: add template market page"
```

---

### Task 14: Template Detail Page

**Files:**
- Create: `src/app/(main)/templates/[id]/page.tsx`

- [ ] **Step 1: Create template detail page with deploy guide**

Create `src/app/(main)/templates/[id]/page.tsx`:

```tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTemplate, TEMPLATES } from "@/lib/templates";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return TEMPLATES.map((t) => ({ id: t.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const template = getTemplate(id);
  if (!template) return { title: "模板不存在" };
  return {
    title: `${template.name} — 模板详情`,
    description: template.description,
  };
}

export default async function TemplateDetailPage({ params }: Props) {
  const { id } = await params;
  const template = getTemplate(id);

  if (!template) notFound();

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <Link
        href="/templates"
        className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors mb-6 inline-block"
      >
        &larr; 返回模板市场
      </Link>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden mb-10">
        <div className="aspect-video bg-zinc-100 flex items-center justify-center text-zinc-400">
          {template.thumbnail ? (
            <img
              src={template.thumbnail}
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span>预览图</span>
          )}
        </div>
      </div>

      <h1 className="font-display text-3xl font-semibold text-zinc-900 mb-3">
        {template.name}
      </h1>
      <p className="text-zinc-500 text-base mb-6">{template.description}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {template.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-zinc-100 text-zinc-600 text-sm rounded-full"
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-6 mb-10">
        <h2 className="font-display text-lg font-semibold text-zinc-900 mb-3">
          功能特性
        </h2>
        <ul className="space-y-2">
          {template.features.map((feature) => (
            <li key={feature} className="text-sm text-zinc-600 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-zinc-900 rounded-full shrink-0" />
              {feature}
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 mb-10">
        <h2 className="font-display text-lg font-semibold text-zinc-900 mb-4">
          部署指南
        </h2>
        <ol className="space-y-4 text-sm text-zinc-600">
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-zinc-900">注册 Vercel 账号</strong>
              <p className="mt-1">
                前往{" "}
                <a
                  href="https://vercel.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  vercel.com
                </a>{" "}
                注册，推荐使用 GitHub 登录。
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-zinc-900">复制模板仓库</strong>
              <p className="mt-1">
                打开{" "}
                <a
                  href={template.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {template.repoUrl}
                </a>
                ，点击 &quot;Use this template&quot;，创建你自己的副本。
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-zinc-900">在 Vercel 导入仓库</strong>
              <p className="mt-1">
                在 Vercel Dashboard 点击 &quot;Import Project&quot;，选择你的仓库。
                设置以下环境变量（Environment Variables）：
              </p>
              <div className="mt-2 bg-zinc-800 text-zinc-200 p-3 rounded-lg font-mono text-xs overflow-x-auto">
                <div>NEXT_PUBLIC_BLOG_API_URL = https://your-platform-url.com</div>
                <div>NEXT_PUBLIC_USERNAME = your-username</div>
              </div>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
              4
            </span>
            <div>
              <strong className="text-zinc-900">创建 Deploy Hook</strong>
              <p className="mt-1">
                在 Vercel 项目设置 &gt; Git &gt; Deploy Hooks 中，创建一个 hook，
                复制生成的 URL。
              </p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="w-6 h-6 bg-zinc-900 text-white rounded-full flex items-center justify-center text-xs shrink-0 mt-0.5">
              5
            </span>
            <div>
              <strong className="text-zinc-900">回到平台完成配置</strong>
              <p className="mt-1">
                前往{" "}
                <Link
                  href="/dashboard/deploy"
                  className="text-blue-600 hover:underline"
                >
                  部署管理
                </Link>{" "}
                页面，粘贴 Deploy Hook URL，点击完成设置。
              </p>
            </div>
          </li>
        </ol>
      </div>

      <div className="flex gap-4">
        <a
          href={template.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-full hover:bg-zinc-800 transition-colors"
        >
          查看模板仓库
        </a>
        <a
          href={template.demoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center px-5 py-2.5 border border-zinc-300 text-zinc-900 text-sm font-medium rounded-full hover:bg-zinc-50 transition-colors"
        >
          查看演示站
        </a>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/templates
git commit -m "feat: add template detail page with deploy guide"
```

---

### Task 15: Deployment Dashboard Page

**Files:**
- Create: `src/app/(main)/dashboard/deploy/page.tsx`

- [ ] **Step 1: Create "use client" deployment dashboard**

Create `src/app/(main)/dashboard/deploy/page.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/\(main\)/dashboard
git commit -m "feat: add deployment dashboard with sync status and manual trigger"
```

---

### Task 16: NavBar — Add template and deploy links

**Files:**
- Modify: `src/components/NavBar.tsx`

- [ ] **Step 1: Add template and deploy links to NavBar**

Find the navbar link section in `src/components/NavBar.tsx`. Add two new `Link` entries next to existing navigation links:

```tsx
<Link
  href="/templates"
  className={`text-sm font-medium transition-colors ${
    pathname.startsWith("/templates") ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
  }`}
>
  模板
</Link>
```

And for logged-in users, add a deploy dashboard link near the messages/notification icon area:

```tsx
{session && (
  <Link
    href="/dashboard/deploy"
    className={`text-sm font-medium transition-colors ${
      pathname === "/dashboard/deploy" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-900"
    }`}
  >
    部署
  </Link>
)}
```

- [ ] **Step 2: Verify compilation**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Verify all tests still pass**

```bash
npx vitest run
```

Expected: All existing tests + new tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/NavBar.tsx
git commit -m "feat: add template and deploy links to NavBar"
```

---

### Task 17: Final Verification — Full test run

- [ ] **Step 1: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass (existing + new).

- [ ] **Step 2: Type check**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Production build check**

```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 4: Commit if any final changes**

```bash
git add -A
git commit -m "chore: final verification passes"
```

---

### Summary of All Commits

| # | Commit | Task |
|---|--------|------|
| 1 | `feat: add SiteDeployment model for template deploy tracking` | Task 1 |
| 2 | `feat: add public_read rate limit (60 req/min) for public API` | Task 2 |
| 3 | `feat: add public profile API with rate limit and cache headers` | Task 3 |
| 4 | `feat: add public posts list API with rate limit` | Task 4 |
| 5 | `feat: add public single post API with Markdown content` | Task 5 |
| 6 | `feat: add triggerDeploy with sync status tracking` | Task 6 |
| 7 | `feat: add deployment CRUD API (PUT/GET/DELETE)` | Task 7 |
| 8 | `feat: add manual sync endpoint for deployment` | Task 8 |
| 9 | `feat: trigger deploy sync on post creation` | Task 9 |
| 10 | `feat: trigger deploy sync on post edit and delete` | Task 10 |
| 11 | `feat: trigger deploy sync on profile update` | Task 11 |
| 12 | `feat: add template catalog config with 2 templates` | Task 12 |
| 13 | `feat: add template market page` | Task 13 |
| 14 | `feat: add template detail page with deploy guide` | Task 14 |
| 15 | `feat: add deployment dashboard with sync status and manual trigger` | Task 15 |
| 16 | `feat: add template and deploy links to NavBar` | Task 16 |
| 17 | `chore: final verification passes` | Task 17 |

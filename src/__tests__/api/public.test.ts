import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  user: { findUnique: vi.fn() },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: vi.fn().mockResolvedValue(true) }));

const mockHeadersGet = vi.fn().mockReturnValue("127.0.0.1");
const mockHeadersObj = { get: mockHeadersGet };
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue(mockHeadersObj),
}));

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
    expect(body.bio).toBe("A developer blog");
    expect(body.avatarUrl).toBe("https://example.com/avatar.jpg");
  });

  it("returns 404 for non-existent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/public/profile/[username]/route");
    const req = new Request("http://localhost/api/public/profile/nobody");
    const res = await GET(req, { params: Promise.resolve({ username: "nobody" }) });

    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error).toBe("用户不存在");
  });

  it("returns 404 when user exists but has no profile", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: "u1",
      username: "alice",
      profile: null,
    });

    const { GET } = await import("@/app/api/public/profile/[username]/route");
    const req = new Request("http://localhost/api/public/profile/alice");
    const res = await GET(req, { params: Promise.resolve({ username: "alice" }) });

    expect(res.status).toBe(404);
  });

  it("returns 429 when rate limited", async () => {
    const mockRateLimit = await import("@/lib/rate-limit");
    (mockRateLimit.checkRateLimit as any).mockResolvedValueOnce(false);

    const { GET } = await import("@/app/api/public/profile/[username]/route");
    const req = new Request("http://localhost/api/public/profile/alice");
    const res = await GET(req, { params: Promise.resolve({ username: "alice" }) });

    expect(res.status).toBe(429);
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

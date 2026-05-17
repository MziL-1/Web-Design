import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = {
  user: { findUnique: vi.fn() },
  profile: { findUnique: vi.fn() },
  post: { findMany: vi.fn(), findUnique: vi.fn(), count: vi.fn() },
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

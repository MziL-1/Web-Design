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

const mockPrisma = {
  siteDeployment: {
    findUnique: vi.fn() as any,
    upsert: vi.fn() as any,
    delete: vi.fn() as any,
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "u1", username: "alice" } }),
}));
vi.mock("@/lib/sync", () => ({ triggerDeploy: vi.fn() }));

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

  it("rejects non-Vercel deploy hook URL", async () => {
    const { PUT } = await import("@/app/api/deployment/route");
    const req = new Request("http://localhost/api/deployment", {
      method: "PUT",
      body: JSON.stringify({
        templateId: "minimal-blog",
        deployHookUrl: "https://evil.com/hook",
      }),
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
    const err = new Error("Record to delete does not exist") as any;
    err.code = "P2025";
    mockPrisma.siteDeployment.delete.mockRejectedValueOnce(err);

    const { DELETE } = await import("@/app/api/deployment/route");
    const req = new Request("http://localhost/api/deployment", { method: "DELETE" });
    const res = await DELETE(req);

    expect(res.status).toBe(404);
  });
});

describe("POST /api/deployment/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers immediate deploy and returns success", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
    const syncMod = await import("@/lib/sync");
    (syncMod.triggerDeploy as any).mockResolvedValueOnce(undefined);
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
    expect(syncMod.triggerDeploy).toHaveBeenCalledWith("u1", true);
  });

  it("returns 404 when user has no deployment", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/deployment/sync/route");
    const req = new Request("http://localhost/api/deployment/sync", {
      method: "POST",
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
  });
});

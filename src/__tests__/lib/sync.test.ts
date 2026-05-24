import { describe, it, expect, vi, beforeEach } from "vitest";

const mockDeployment = {
  id: "d1",
  userId: "u1",
  vercelToken: "token123",
  vercelProjectId: "prj_xxx",
  lastSyncStatus: "success",
};

const mockPrisma = {
  siteDeployment: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));

const mockFetch = vi.fn();
global.fetch = mockFetch;

describe("triggerDeploy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("triggers Vercel redeploy via env var update", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ envs: [] }) });
    mockFetch.mockResolvedValueOnce({ ok: true });

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1", true);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.vercel.com/v9/projects/prj_xxx/env",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: "Bearer token123" }) }),
    );
    expect(mockPrisma.siteDeployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
        data: expect.objectContaining({ lastSyncStatus: "success", lastSyncError: null }),
      }),
    );
  });

  it("does nothing when user has no deployment", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(null);

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1", true);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPrisma.siteDeployment.update).not.toHaveBeenCalled();
  });

  it("records failure status on network error", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ envs: [] }) });
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1", true);

    expect(mockPrisma.siteDeployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "u1" },
        data: expect.objectContaining({
          lastSyncStatus: "failed",
          lastSyncError: "Network error",
        }),
      }),
    );
  });

  it("records failure on missing token", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce({
      ...mockDeployment,
      vercelToken: null,
    });

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1", true);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPrisma.siteDeployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastSyncStatus: "failed",
          lastSyncError: "缺少 Vercel Token 或项目ID，请重新部署",
        }),
      }),
    );
  });

  it("debounces multiple calls and defers execution", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValue(mockDeployment);
    mockFetch.mockResolvedValue({ ok: true, json: async () => ({ envs: [] }) });

    const { triggerDeploy } = await import("@/lib/sync");

    triggerDeploy("u1");
    triggerDeploy("u1");
    triggerDeploy("u1");

    expect(mockFetch).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 3100));

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });
});

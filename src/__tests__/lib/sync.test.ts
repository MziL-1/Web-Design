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
    await triggerDeploy("u1", true);

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
    await triggerDeploy("u1", true);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPrisma.siteDeployment.update).not.toHaveBeenCalled();
  });

  it("records failure status on network error", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
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
      })
    );
  });

  it("records failure on non-ok response", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce(mockDeployment);
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1", true);

    expect(mockPrisma.siteDeployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ lastSyncStatus: "failed" }),
      })
    );
  });

  it("records failure on invalid deploy hook URL", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValueOnce({
      ...mockDeployment,
      deployHookUrl: "http://evil.com/hook",
    });

    const { triggerDeploy } = await import("@/lib/sync");
    await triggerDeploy("u1", true);

    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPrisma.siteDeployment.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastSyncStatus: "failed",
          lastSyncError: "Invalid deploy hook URL",
        }),
      })
    );
  });

  it("debounces multiple calls and defers execution", async () => {
    mockPrisma.siteDeployment.findUnique.mockResolvedValue(mockDeployment);
    mockFetch.mockResolvedValue({ ok: true });

    const { triggerDeploy } = await import("@/lib/sync");

    triggerDeploy("u1");
    triggerDeploy("u1");
    triggerDeploy("u1");

    expect(mockFetch).not.toHaveBeenCalled();

    await new Promise((r) => setTimeout(r, 3100));

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

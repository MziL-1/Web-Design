import { describe, it, expect, vi, beforeEach } from "vitest";

const mockMessages = [
  {
    id: "m1",
    senderId: "u2",
    receiverId: "u1",
    content: "Hi!",
    read: false,
    createdAt: new Date("2026-05-23T10:00:00Z"),
  },
  {
    id: "m2",
    senderId: "u1",
    receiverId: "u2",
    content: "Hello!",
    read: true,
    createdAt: new Date("2026-05-23T10:01:00Z"),
  },
  {
    id: "m3",
    senderId: "u3",
    receiverId: "u1",
    content: "Hey there",
    read: true,
    createdAt: new Date("2026-05-23T09:00:00Z"),
  },
];

const mockSender = {
  id: "u2",
  username: "bob",
  profile: { displayName: "Bob Chen", avatarUrl: null },
};

const mockReceiver = {
  id: "u1",
  username: "alice",
  profile: { displayName: "Alice", avatarUrl: null },
};

const mockPrisma = {
  message: {
    create: vi.fn() as any,
    findMany: vi.fn() as any,
    count: vi.fn() as any,
    updateMany: vi.fn() as any,
    findFirst: vi.fn() as any,
    groupBy: vi.fn() as any,
  },
  user: {
    findUnique: vi.fn() as any,
  },
};

vi.mock("@/lib/prisma", () => ({ prisma: mockPrisma }));
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { id: "u1", username: "alice" } }),
}));

describe("POST /api/messages", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("sends a message and returns it", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(mockSender);
    mockPrisma.message.create.mockResolvedValueOnce({
      ...mockMessages[0],
      sender: { username: "alice", profile: null },
      receiver: { username: "bob", profile: null },
    });

    const { POST } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: "u2", content: "Hi!" }),
    });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.content).toBe("Hi!");
    expect(mockPrisma.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          senderId: "u1",
          receiverId: "u2",
          content: "Hi!",
        }),
      })
    );
  });

  it("returns 401 for unauthenticated user", async () => {
    const authMod = await import("@/lib/auth");
    (authMod.auth as any).mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId: "u2", content: "Hi!" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when receiverId is missing", async () => {
    const { POST } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({ content: "Hi!" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is missing", async () => {
    const { POST } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId: "u2" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when content is empty string", async () => {
    const { POST } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId: "u2", content: "   " }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when sending to self", async () => {
    const { POST } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId: "u1", content: "Hi" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 404 when receiver does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages", {
      method: "POST",
      body: JSON.stringify({ receiverId: "u999", content: "Hi!" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/messages (conversations list)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns conversations with last message and unread count", async () => {
    const messagesWithUsers = [
      {
        ...mockMessages[0],
        sender: { username: "bob", profile: { displayName: "Bob Chen", avatarUrl: null } },
        receiver: { username: "alice", profile: { displayName: "Alice", avatarUrl: null } },
      },
      {
        ...mockMessages[2],
        sender: { username: "carol", profile: { displayName: "Carol", avatarUrl: null } },
        receiver: { username: "alice", profile: { displayName: "Alice", avatarUrl: null } },
      },
    ];
    mockPrisma.message.findMany.mockResolvedValueOnce(messagesWithUsers);
    mockPrisma.message.groupBy.mockResolvedValueOnce([
      { senderId: "u2", _count: { id: 1 } },
    ]);

    const { GET } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
  });

  it("returns 401 for unauthenticated user", async () => {
    const authMod = await import("@/lib/auth");
    (authMod.auth as any).mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/messages?with=userId (conversation)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns messages between two users", async () => {
    const msgs = [
      { ...mockMessages[0], sender: { username: "bob", profile: { displayName: "Bob", avatarUrl: null } } },
      { ...mockMessages[1], sender: { username: "alice", profile: { displayName: "Alice", avatarUrl: null } } },
    ];
    mockPrisma.message.findMany.mockResolvedValueOnce(msgs);

    const { GET } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages?with=u2");
    const res = await GET(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBe(2);
  });

  it("marks messages from the other user as read", async () => {
    const msgs = [
      { ...mockMessages[0], sender: { username: "bob", profile: { displayName: "Bob", avatarUrl: null } } },
    ];
    mockPrisma.message.findMany.mockResolvedValueOnce(msgs);

    const { GET } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages?with=u2");
    await GET(req);

    expect(mockPrisma.message.updateMany).toHaveBeenCalledWith({
      where: {
        receiverId: "u1",
        senderId: "u2",
        read: false,
      },
      data: { read: true },
    });
  });

  it("returns 400 when with param is missing", async () => {
    const { GET } = await import("@/app/api/messages/route");
    const req = new Request("http://localhost/api/messages?with=");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});

describe("GET /api/messages/unread-count", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns unread message count", async () => {
    mockPrisma.message.count.mockResolvedValueOnce(3);

    const { GET: getUnread } = await import("@/app/api/messages/unread-count/route");
    const req = new Request("http://localhost/api/messages/unread-count");
    const res = await getUnread(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.count).toBe(3);
    expect(mockPrisma.message.count).toHaveBeenCalledWith({
      where: { receiverId: "u1", read: false },
    });
  });

  it("returns 401 for unauthenticated user", async () => {
    const authMod = await import("@/lib/auth");
    (authMod.auth as any).mockResolvedValueOnce(null);

    const { GET: getUnread } = await import("@/app/api/messages/unread-count/route");
    const req = new Request("http://localhost/api/messages/unread-count");
    const res = await getUnread(req);
    expect(res.status).toBe(401);
  });
});

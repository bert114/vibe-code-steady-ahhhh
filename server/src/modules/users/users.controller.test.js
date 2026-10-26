import { beforeEach, describe, expect, it, vi } from "vitest";

const service = vi.hoisted(() => ({
  getUserProfile: vi.fn(),
  deleteUser: vi.fn(),
  exportUserData: vi.fn(),
}));

vi.mock("./users.service.js", () => service);

import { getMe } from "./users.controller.js";

describe("getMe", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated user's email from their profile", async () => {
    service.getUserProfile.mockResolvedValue({
      role: "user",
      email: "person@example.test",
      created_at: "2026-01-01T00:00:00.000Z",
    });
    const res = { json: vi.fn() };

    await getMe({ user: { id: "user_clerk_123", role: "user" } }, res, vi.fn());

    expect(service.getUserProfile).toHaveBeenCalledWith("user_clerk_123");
    expect(res.json).toHaveBeenCalledWith({
      id: "user_clerk_123",
      role: "user",
      clerkSub: null,
      email: "person@example.test",
      createdAt: "2026-01-01T00:00:00.000Z",
    });
  });

  it("returns null email when the local row has no email", async () => {
    service.getUserProfile.mockResolvedValue(null);
    const res = { json: vi.fn() };

    await getMe({ user: { id: "user_clerk_123" } }, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith({
      id: "user_clerk_123",
      role: "user",
      clerkSub: null,
      email: null,
      createdAt: null,
    });
  });
});

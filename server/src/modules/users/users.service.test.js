import { beforeEach, describe, expect, it, vi } from "vitest";

const repository = vi.hoisted(() => ({
  findUserByClerkSub: vi.fn(),
  createUserForClerkSub: vi.fn(),
  updateUserEmail: vi.fn(),
}));

vi.mock("./users.repository.js", () => repository);

import { syncUserFromClerk } from "./users.service.js";

describe("syncUserFromClerk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an existing user's email while preserving their internal ID and role", async () => {
    repository.findUserByClerkSub.mockResolvedValue({ userId: "internal-123", role: "admin" });
    repository.updateUserEmail.mockResolvedValue({
      id: "internal-123",
      role: "admin",
      email: "updated@example.test",
    });

    const user = await syncUserFromClerk("clerk-123", "updated@example.test");

    expect(user).toEqual({ id: "internal-123", role: "admin", email: "updated@example.test" });
    expect(repository.createUserForClerkSub).not.toHaveBeenCalled();
    expect(repository.updateUserEmail).toHaveBeenCalledWith("internal-123", "updated@example.test");
  });

  it("creates a local user for a new Clerk identity and stores its email", async () => {
    repository.findUserByClerkSub.mockResolvedValue(null);
    repository.createUserForClerkSub.mockResolvedValue({ userId: "internal-new", role: "user" });
    repository.updateUserEmail.mockResolvedValue({
      id: "internal-new",
      role: "user",
      email: "new@example.test",
    });

    const user = await syncUserFromClerk("clerk-new", "new@example.test");

    expect(user).toEqual({ id: "internal-new", role: "user", email: "new@example.test" });
    expect(repository.createUserForClerkSub).toHaveBeenCalledWith("clerk-new", "user");
    expect(repository.updateUserEmail).toHaveBeenCalledWith("internal-new", "new@example.test");
  });

  it("keeps repeated deliveries on the existing local account", async () => {
    repository.findUserByClerkSub.mockResolvedValue({ userId: "internal-stable", role: "user" });
    repository.updateUserEmail.mockResolvedValue({
      id: "internal-stable",
      role: "user",
      email: "same@example.test",
    });

    const first = await syncUserFromClerk("clerk-stable", "same@example.test");
    const second = await syncUserFromClerk("clerk-stable", "same@example.test");

    expect(first.id).toBe(second.id);
    expect(first.role).toBe(second.role);
    expect(repository.createUserForClerkSub).not.toHaveBeenCalled();
    expect(repository.updateUserEmail).toHaveBeenCalledTimes(2);
  });
});

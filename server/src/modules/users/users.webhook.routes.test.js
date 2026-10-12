import express from "express";
import request from "supertest";
import { describe, expect, it, vi } from "vitest";
import { createClerkWebhookRouter } from "./users.webhook.routes.js";

function webhookApp(options) {
  const app = express();
  app.use("/api/webhooks", createClerkWebhookRouter(options));
  // This parser intentionally follows the webhook router, as in app.js.
  app.use(express.json());
  return app;
}

function postEvent(app, payload = { example: true }) {
  return request(app)
    .post("/api/webhooks/clerk")
    .set("Content-Type", "application/json")
    .set("svix-id", "msg_test_123")
    .send(JSON.stringify(payload));
}

describe("Clerk webhook", () => {
  it("syncs the primary email from user.created without logging the address", async () => {
    const syncUserFn = vi.fn(async () => ({ id: "local-user-id", role: "user" }));
    const log = vi.fn();
    let receivedBody;
    let receivedSecret;
    const app = webhookApp({
      signingSecret: "whsec_test",
      syncUserFn,
      log,
      verifyWebhookFn: async (req, options) => {
        receivedBody = req.body;
        receivedSecret = options.signingSecret;
        return {
          type: "user.created",
          data: {
            id: "user_new_123",
            primary_email_address_id: "email_primary",
            email_addresses: [
              { id: "email_other", email_address: "other@example.test" },
              { id: "email_primary", email_address: "private@example.test" },
            ],
          },
        };
      },
    });

    const res = await postEvent(app);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
    expect(Buffer.isBuffer(receivedBody)).toBe(true);
    expect(receivedSecret).toBe("whsec_test");
    expect(syncUserFn).toHaveBeenCalledWith("user_new_123", "private@example.test");
    expect(log).toHaveBeenCalledTimes(1);
    expect(log.mock.calls[0][0]).toContain('"eventType":"user.created"');
    expect(log.mock.calls[0][0]).not.toContain("private@example.test");
  });

  it("looks up the current email on sign-in and syncs updates", async () => {
    const syncUserFn = vi.fn(async () => ({ id: "local-user-id", role: "user" }));
    const getClerkUserFn = vi.fn(async () => ({
      primary_email_address_id: "email_primary",
      email_addresses: [{ id: "email_primary", email_address: "current@example.test" }],
    }));
    let event = { type: "session.created", data: { user_id: "user_existing_456" } };
    const app = webhookApp({
      signingSecret: "whsec_test",
      syncUserFn,
      getClerkUserFn,
      verifyWebhookFn: async () => event,
      log: vi.fn(),
    });

    const signInRes = await postEvent(app);
    expect(signInRes.status).toBe(200);
    expect(getClerkUserFn).toHaveBeenCalledWith("user_existing_456");
    expect(syncUserFn).toHaveBeenCalledWith("user_existing_456", "current@example.test");

    event = {
      type: "user.updated",
      data: {
        id: "user_existing_456",
        primary_email_address_id: "email_new",
        email_addresses: [{ id: "email_new", email_address: "updated@example.test" }],
      },
    };
    const updateRes = await postEvent(app);
    expect(updateRes.status).toBe(200);
    expect(syncUserFn).toHaveBeenLastCalledWith("user_existing_456", "updated@example.test");
    expect(getClerkUserFn).toHaveBeenCalledTimes(1);
  });

  it("stores null when Clerk has no primary email and ignores unrelated events", async () => {
    const syncUserFn = vi.fn(async () => ({ id: "local-user-id", role: "user" }));
    let event = {
      type: "user.created",
      data: { id: "user_no_email", email_addresses: [{ id: "email_1", email_address: "one@example.test" }] },
    };
    const app = webhookApp({
      signingSecret: "whsec_test",
      syncUserFn,
      verifyWebhookFn: async () => event,
      log: vi.fn(),
    });

    expect((await postEvent(app)).status).toBe(200);
    expect(syncUserFn).toHaveBeenCalledWith("user_no_email", null);

    event = { type: "organization.updated", data: { id: "org_123" } };
    expect((await postEvent(app)).status).toBe(200);
    expect(syncUserFn).toHaveBeenCalledTimes(1);
  });

  it("routes repeated user deliveries through the same Clerk identity", async () => {
    const syncUserFn = vi.fn(async () => ({ id: "stable-local-user-id", role: "user" }));
    const events = [
      { type: "user.created", data: { id: "user_same_123", primary_email_address_id: "e1", email_addresses: [{ id: "e1", email_address: "one@example.test" }] } },
      { type: "user.updated", data: { id: "user_same_123", primary_email_address_id: "e2", email_addresses: [{ id: "e2", email_address: "two@example.test" }] } },
      { type: "user.created", data: { id: "user_same_123", primary_email_address_id: "e1", email_addresses: [{ id: "e1", email_address: "one@example.test" }] } },
    ];
    const app = webhookApp({
      signingSecret: "whsec_test",
      syncUserFn,
      verifyWebhookFn: async () => events.shift(),
      log: vi.fn(),
    });

    for (let index = 0; index < 3; index += 1) {
      expect((await postEvent(app)).status).toBe(200);
    }

    expect(syncUserFn).toHaveBeenCalledTimes(3);
    expect(syncUserFn.mock.calls.map(([clerkSub]) => clerkSub)).toEqual([
      "user_same_123",
      "user_same_123",
      "user_same_123",
    ]);
  });

  it("rejects invalid signatures without syncing a user", async () => {
    const syncUserFn = vi.fn();
    const app = webhookApp({
      signingSecret: "whsec_test",
      syncUserFn,
      verifyWebhookFn: async () => {
        throw new Error("signature details must not be exposed");
      },
      log: vi.fn(),
    });

    const res = await postEvent(app);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatchObject({ code: "WEBHOOK_SIGNATURE_INVALID", details: [] });
    expect(JSON.stringify(res.body)).not.toContain("signature details");
    expect(syncUserFn).not.toHaveBeenCalled();
  });

  it("fails closed when the signing secret is missing", async () => {
    const verifyWebhookFn = vi.fn();
    const app = webhookApp({ signingSecret: "", verifyWebhookFn, log: vi.fn() });

    const res = await postEvent(app);

    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe("WEBHOOK_NOT_CONFIGURED");
    expect(verifyWebhookFn).not.toHaveBeenCalled();
  });

  it("returns a retryable error and safe log if syncing fails", async () => {
    const log = vi.fn();
    const app = webhookApp({
      signingSecret: "whsec_test",
      syncUserFn: async () => {
        throw new Error("database connection details must not be exposed");
      },
      verifyWebhookFn: async () => ({ type: "user.updated", data: { id: "user_retry_789" } }),
      log,
    });

    const res = await postEvent(app);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatchObject({ code: "WEBHOOK_PROCESSING_FAILED", details: [] });
    expect(JSON.stringify(res.body)).not.toContain("database connection details");
    expect(log.mock.calls[0][0]).toContain('"errorCode":"USER_PROVISIONING_FAILED"');
    expect(log.mock.calls[0][0]).not.toContain("database connection details");
  });

  it("returns a retryable error when Clerk lookup fails without exposing details", async () => {
    const syncUserFn = vi.fn();
    const log = vi.fn();
    const app = webhookApp({
      signingSecret: "whsec_test",
      syncUserFn,
      getClerkUserFn: async () => {
        throw new Error("private Clerk API details");
      },
      verifyWebhookFn: async () => ({ type: "session.created", data: { user_id: "user_retry_789" } }),
      log,
    });

    const res = await postEvent(app);

    expect(res.status).toBe(500);
    expect(res.body.error.code).toBe("WEBHOOK_PROCESSING_FAILED");
    expect(log.mock.calls[0][0]).toContain('"errorCode":"CLERK_USER_LOOKUP_FAILED"');
    expect(log.mock.calls[0][0]).not.toContain("private Clerk API details");
    expect(syncUserFn).not.toHaveBeenCalled();
  });

  it("rejects a recognized event without a user ID", async () => {
    const syncUserFn = vi.fn();
    const app = webhookApp({
      signingSecret: "whsec_test",
      syncUserFn,
      verifyWebhookFn: async () => ({ type: "session.created", data: {} }),
      log: vi.fn(),
    });

    const res = await postEvent(app);

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("WEBHOOK_INVALID_EVENT");
    expect(syncUserFn).not.toHaveBeenCalled();
  });
});

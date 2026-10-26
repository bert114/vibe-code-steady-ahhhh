import { clerkClient } from "@clerk/express";
import { verifyWebhook } from "@clerk/express/webhooks";
import { env } from "../../config/env.js";
import { syncUserFromClerk } from "./users.service.js";

function sendError(res, status, code, message) {
  return res.status(status).json({
    error: { code, message, details: [] },
  });
}

function writeSafeLog(log, fields) {
  try {
    log(`[clerk-webhook] ${JSON.stringify(fields)}`);
  } catch {
    // Logging must not change webhook processing or expose the event payload.
  }
}

function primaryEmail(user) {
  const addresses = Array.isArray(user?.email_addresses) ? user.email_addresses : [];
  const primary = addresses.find(
    (address) => address?.id === user?.primary_email_address_id,
  );
  return typeof primary?.email_address === "string" ? primary.email_address : null;
}

export function createClerkWebhookHandler({
  verifyWebhookFn = verifyWebhook,
  syncUserFn = syncUserFromClerk,
  getClerkUserFn = (clerkSub) => clerkClient.users.getUser(clerkSub),
  signingSecret = env.CLERK_WEBHOOK_SIGNING_SECRET,
  log = console.log,
} = {}) {
  return async function clerkWebhookHandler(req, res) {
    if (!signingSecret) {
      return sendError(
        res,
        503,
        "WEBHOOK_NOT_CONFIGURED",
        "The Clerk webhook signing secret is not configured.",
      );
    }

    let event;
    try {
      event = await verifyWebhookFn(req, { signingSecret });
    } catch {
      return sendError(
        res,
        400,
        "WEBHOOK_SIGNATURE_INVALID",
        "The webhook signature could not be verified.",
      );
    }

    const eventId = req.get("svix-id") ?? null;
    const eventType = event?.type;
    let clerkSub;
    let email;

    if (eventType === "user.created" || eventType === "user.updated") {
      clerkSub = event.data?.id;
      email = primaryEmail(event.data);
    } else if (eventType === "session.created") {
      clerkSub = event.data?.user_id;
      if (typeof clerkSub === "string" && clerkSub.length > 0) {
        try {
          email = primaryEmail(await getClerkUserFn(clerkSub));
        } catch {
          writeSafeLog(log, {
            eventId,
            eventType,
            outcome: "failed",
            errorCode: "CLERK_USER_LOOKUP_FAILED",
          });
          return sendError(
            res,
            500,
            "WEBHOOK_PROCESSING_FAILED",
            "The webhook could not be processed.",
          );
        }
      }
    } else {
      writeSafeLog(log, { eventId, eventType: eventType ?? "unknown", outcome: "ignored" });
      return res.status(200).json({ received: true });
    }

    if (typeof clerkSub !== "string" || clerkSub.length === 0) {
      return sendError(
        res,
        400,
        "WEBHOOK_INVALID_EVENT",
        "The Clerk event did not include a user ID.",
      );
    }

    try {
      await syncUserFn(clerkSub, email ?? null);
    } catch {
      writeSafeLog(log, {
        eventId,
        eventType,
        outcome: "failed",
        errorCode: "USER_PROVISIONING_FAILED",
      });
      return sendError(
        res,
        500,
        "WEBHOOK_PROCESSING_FAILED",
        "The webhook could not be processed.",
      );
    }

    writeSafeLog(log, { eventId, eventType, outcome: "processed" });
    return res.status(200).json({ received: true });
  };
}

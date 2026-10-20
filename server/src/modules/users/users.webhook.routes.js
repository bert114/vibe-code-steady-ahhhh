import express, { Router } from "express";
import { createClerkWebhookHandler } from "./users.webhook.controller.js";
import { withController } from "../../middleware/withController.js";

export function createClerkWebhookRouter(options) {
  const router = Router();
  router.post(
    "/clerk",
    express.raw({ type: "application/json", limit: "100kb" }),
    withController("users.webhook", createClerkWebhookHandler(options)),
  );
  return router;
}

export const clerkWebhookRouter = createClerkWebhookRouter();

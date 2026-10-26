import express, { Router } from "express";
import { createClerkWebhookHandler } from "./users.webhook.controller.js";

export function createClerkWebhookRouter(options) {
  const router = Router();
  router.post(
    "/clerk",
    express.raw({ type: "application/json", limit: "100kb" }),
    createClerkWebhookHandler(options),
  );
  return router;
}

export const clerkWebhookRouter = createClerkWebhookRouter();

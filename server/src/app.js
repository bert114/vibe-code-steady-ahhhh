import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { checkDatabase } from "./db/pool.js";
import { audit } from "./middleware/audit.js";
import { authResolver } from "./middleware/auth.js";
import { createClerkResolver } from "./middleware/clerk.js";
import { errorHandler, notFound } from "./middleware/error.js";
import { checkinsRouter } from "./modules/checkins/checkins.routes.js";
import { dashboardRouter } from "./modules/dashboard/dashboard.routes.js";
import { insightsRouter } from "./modules/insights/insights.routes.js";
import { remindersRouter } from "./modules/reminders/reminders.routes.js";
import { usersRouter } from "./modules/users/users.routes.js";

const clerkResolver = createClerkResolver();

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_ORIGIN }));
  app.use(express.json({ limit: "100kb" }));
  app.use(audit);

  app.get("/api/health", async (_req, res) => {
    res.json({ status: "ok", db: await checkDatabase() });
  });

  app.get("/", (_req, res) => {
    res.json({
      name: "steady-ahh-api",
      version: "0.1.0",
      status: "ok",
      message: "Steady-Ahh API is running",
      links: {
        health: "/api/health",
        checkins: "/api/check-ins",
        insights: "/api/insights",
        dashboard: "/api/dashboard",
      },
    });
  });

  if (env.CLERK_SECRET_KEY) {
    app.use(clerkMiddleware());
  }
  app.use(authResolver);
  app.use(clerkResolver);

  app.use("/api/check-ins", checkinsRouter);
  app.use("/api/insights", insightsRouter);
  app.use("/api/reminders", remindersRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/users", usersRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

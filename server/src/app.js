import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { env } from "./config/env.js";
import { checkDatabase, getLastDbError } from "./db/pool.js";
import { audit } from "./middleware/audit.js";
import { authResolver, requireRole, requireUser } from "./middleware/auth.js";
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

  // try/catch + next(err) is load-bearing: Express 4 does not forward
  // async rejections to errorHandler on its own, so without this a thrown
  // DB error would hang the request instead of returning the error contract.
  app.get("/api/health", async (_req, res, next) => {
    try {
      const db = await checkDatabase();
      const body = { status: "ok", db };
      // Specific error detail for debugging. Dev only — production keeps
      // the bare contract so internals (hosts, pg codes) don't leak.
      if (db === "down" && env.NODE_ENV !== "production") {
        const detail = getLastDbError();
        if (detail) body.detail = detail;
      }
      res.json(body);
    } catch (err) {
      next(err);
    }
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
  app.use(clerkResolver);
  app.use(authResolver);

  app.use("/api/check-ins", checkinsRouter);
  app.use("/api/insights", insightsRouter);
  app.use("/api/reminders", remindersRouter);
  app.use("/api/dashboard", dashboardRouter);
  app.use("/api/users", usersRouter);

  app.get("/api/admin/overview", requireUser, requireRole("admin"), (req, res) => {
    res.json({
      status: "ok",
      admin: true,
      user: { id: req.user.id, role: req.user.role },
      timestamp: new Date().toISOString(),
    });
  });

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

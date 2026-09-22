import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireUser } from "../../middleware/auth.js";
import {
  getInsightByIdController,
  getInsights,
  getSignals,
  postAnalyze,
} from "./insights.controller.js";

export const insightsRouter = Router();

insightsRouter.use(requireUser);
// Signals are cheap local computation — no limit. Analysis spends AI quota.
insightsRouter.get("/signals", getSignals);
insightsRouter.get("/", getInsights);
insightsRouter.get("/:id", getInsightByIdController);

const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_ANALYSIS_RATE_LIMIT ?? 5),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      code: "RATE_LIMITED",
      message: "Analysis is temporarily limited. Please try again later.",
      details: [],
    },
  },
});

insightsRouter.post("/analyze", analyzeLimiter, postAnalyze);

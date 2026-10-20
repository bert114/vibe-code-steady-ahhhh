import { Router } from "express";
import rateLimit from "express-rate-limit";
import { requireUser } from "../../middleware/auth.js";
import { sendApiError, sourceFile } from "../../middleware/apiError.js";
import { validate } from "../../middleware/validate.js";
import { withController } from "../../middleware/withController.js";
import {
  getInsightByIdHandler,
  getInsights,
  getSignals,
  postAnalyze,
} from "./insights.controller.js";
import { insightIdSchema } from "./insights.validation.js";

export const insightsRouter = Router();
const routesFile = sourceFile(import.meta.url);

insightsRouter.use(requireUser);
// Signals are cheap local computation — no limit. Analysis spends AI quota.
insightsRouter.get(
  "/signals",
  withController("insights.getSignals", getSignals),
);
insightsRouter.get("/", withController("insights.getInsights", getInsights));
insightsRouter.get(
  "/:id",
  validate(insightIdSchema, "params"),
  withController("insights.getInsightByIdHandler", getInsightByIdHandler),
);

const analyzeLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: Number(process.env.AI_ANALYSIS_RATE_LIMIT ?? 5),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  handler: (req, res) => sendApiError(req, res, {
    status: 429,
    code: "RATE_LIMITED",
    message: "Analysis is temporarily limited. Please try again later.",
    triggerFile: routesFile,
    cause: { name: "RateLimitError", code: "RATE_LIMITED", message: "Analysis request limit exceeded." },
  }),
});

insightsRouter.post(
  "/analyze",
  analyzeLimiter,
  withController("insights.postAnalyze", postAnalyze),
);


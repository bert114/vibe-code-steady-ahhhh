import { Router } from "express";
import { requireUser } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import {
  deleteCheckin,
  getCheckinById,
  getCheckins,
  getTrends,
  postCheckin,
} from "./checkins.controller.js";
import {
  checkinIdSchema,
  createCheckinSchema,
  listCheckinsSchema,
  trendsQuerySchema,
} from "./checkins.validation.js";

export const checkinsRouter = Router();

// All check-in routes require an authenticated user (dev bypass in local dev,
// real auth before the external beta).
checkinsRouter.use(requireUser);
checkinsRouter.post("/", validate(createCheckinSchema, "body"), postCheckin);
checkinsRouter.get("/", validate(listCheckinsSchema, "query"), getCheckins);
// Must come before "/:id" — otherwise "trends" is matched as an :id and
// rejected by the uuid check instead of reaching this handler.
checkinsRouter.get("/trends", validate(trendsQuerySchema, "query"), getTrends);
checkinsRouter.get("/:id", validate(checkinIdSchema, "params"), getCheckinById);
checkinsRouter.delete("/:id", validate(checkinIdSchema, "params"), deleteCheckin);


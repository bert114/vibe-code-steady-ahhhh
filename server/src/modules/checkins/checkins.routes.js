import { Router } from "express";
import { requireUser } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import { withController } from "../../middleware/withController.js";
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

checkinsRouter.use(requireUser);
checkinsRouter.post(
  "/",
  validate(createCheckinSchema, "body"),
  withController("checkins.postCheckin", postCheckin),
);
checkinsRouter.get(
  "/",
  validate(listCheckinsSchema, "query"),
  withController("checkins.getCheckins", getCheckins),
);
// Must come before "/:id" — otherwise "trends" is matched as an :id and
// rejected by the uuid check instead of reaching this handler.
checkinsRouter.get(
  "/trends",
  validate(trendsQuerySchema, "query"),
  withController("checkins.getTrends", getTrends),
);
checkinsRouter.get(
  "/:id",
  validate(checkinIdSchema, "params"),
  withController("checkins.getCheckinById", getCheckinById),
);
checkinsRouter.delete(
  "/:id",
  validate(checkinIdSchema, "params"),
  withController("checkins.deleteCheckin", deleteCheckin),
);

// HTTP only: read validated data, call the service, return responses.
// No SQL here, no business rules here.
import * as service from "./checkins.service.js";

export async function postCheckin(req, res, next) {
  try {
    const checkin = await service.createCheckin(req.user.id, req.body);
    res.status(201).json(checkin);
  } catch (err) {
    console.log(err);
    next(err);
  }
}

export async function getCheckins(req, res, next) {
  try {
    const checkins = await service.getCheckins(req.user.id, req.query);
    res.json({ checkins });
  } catch (err) {
    next(err);
  }
}

export async function getCheckinById(req, res, next) {
  try {
    const checkin = await service.getCheckinById(req.user.id, req.params.id);
    if (!checkin) {
      return res.status(404).json({
        error: {
          code: "CHECKIN_NOT_FOUND",
          message: "That check-in was not found.",
          details: [],
        },
      });
    }
    res.json(checkin);
  } catch (err) {
    next(err);
  }
}

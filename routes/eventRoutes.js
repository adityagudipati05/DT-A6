import express from "express";
import {
  createEvent,
  getAllEvents,
  getMyHostedEvents,
  getApprovedEvents,
  participateInEvent,
  getMyEventPasses,
  scanQRCode,
  getEventAttendance,
} from "../controllers/eventController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/create", authenticateToken, createEvent);
router.get("/all", getAllEvents);
router.get("/approved", getApprovedEvents);
router.get("/my-events", authenticateToken, getMyHostedEvents);
router.post("/participate", authenticateToken, participateInEvent);
router.get("/my-passes", authenticateToken, getMyEventPasses);
router.post("/scan-qr", authenticateToken, scanQRCode);
router.get("/:eventId/attendance", authenticateToken, getEventAttendance);

export default router;

import express from "express";
import {
  createEvent,
  getAllEvents,
  getMyHostedEvents,
  getApprovedEvents,
  getMyApprovedEvents,
  participateInEvent,
  getMyEventPasses,
  scanQRCode,
  getEventAttendance,
  markAttendanceByQR,
  getEventPassDetails,
  getStudentAttendanceStats,
} from "../controllers/eventController.js";
import { authenticateToken } from "../middleware/auth.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/create", authenticateToken, createEvent);
router.get("/all", getAllEvents);
router.get("/approved", getApprovedEvents);
router.get("/my-events", authenticateToken, getMyHostedEvents);
router.get("/my-approved-events", authenticateToken, getMyApprovedEvents);
router.post("/participate", authenticateToken, upload.single("proof"), participateInEvent);
router.get("/my-passes", authenticateToken, getMyEventPasses);
router.get("/passes/:passId", authenticateToken, getEventPassDetails);
router.post("/scan-qr", authenticateToken, scanQRCode);
router.post("/mark-attendance", authenticateToken, markAttendanceByQR);
router.get("/:eventId/attendance", authenticateToken, getEventAttendance);
router.get("/stats/attendance", authenticateToken, getStudentAttendanceStats);

export default router;

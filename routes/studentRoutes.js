import express from "express";
import { studentLogin, getStudentProfile, updateStudentProfile, getStudentAttendance, getMyRequests } from "../controllers/studentController.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/login", studentLogin);
router.get("/profile", authenticateToken, getStudentProfile);
router.put("/profile", authenticateToken, updateStudentProfile);
router.get("/attendance", authenticateToken, getStudentAttendance);
router.get("/my-requests", authenticateToken, getMyRequests);

export default router;

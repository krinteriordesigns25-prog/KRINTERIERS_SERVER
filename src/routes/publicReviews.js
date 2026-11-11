import { Router } from "express";
import { getPublicReviews } from "../controllers/reviewController.js";

const router = Router();

// Public read-only endpoint; only published reviews are returned.
router.get("/", getPublicReviews);

export default router;

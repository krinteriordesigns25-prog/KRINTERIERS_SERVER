import { Router } from "express";

import {
  createReview,
  deleteReview,
  getAdminReview,
  getAdminReviews,
  toggleReviewPublished,
  updateReview,
} from "../Controllers/reviewController.js";
import { requireAuth } from "../auth.js";

const router = Router();
console.log("SD");
// All CMS routes require your existing authenticated admin middleware.
router.use(requireAuth);

router.get("/", getAdminReviews);
router.get("/:id", getAdminReview);
router.post("/", createReview);
router.put("/:id", updateReview);
router.patch("/:id/published", toggleReviewPublished);
router.delete("/:id", deleteReview);

export default router;

import { Router } from "express";
import {
  getPublicFAQs,
  getAdminFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  toggleFAQ,
} from "../controllers/faqController.js";
import { requireAuth } from "../auth.js";

// Replace this import with your existing CMS authentication middleware.

const router = Router();

// Public endpoint: no login required
// router.get("/faq", getPublicFAQs);

// All routes below this line require admin authentication
router.use(requireAuth);

router.get("/", getAdminFAQs);
router.post("/", createFAQ);
router.put("/:id", updateFAQ);
router.delete("/:id", deleteFAQ);
router.patch("/:id/status", toggleFAQ);

export default router;

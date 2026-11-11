import express from "express";
import {
  getCategories,
  getPublicCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getAdminDesigns,
  getPublicDesigns,
  getPublicDesignBySlug,
  createDesign,
  updateDesign,
  deleteDesign,
  getAdminFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
  uploadDesignImages,
} from "../controllers/designGallery.js";

import upload from "../designUpload.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

// PUBLIC WEBSITE
router.get("/public/categories", getPublicCategories);
router.get("/public/designs", getPublicDesigns);
router.get("/public/designs/:slug", getPublicDesignBySlug);

// ADMIN - CATEGORIES
router.get("/admin/categories", requireAuth, getCategories);
router.post("/admin/categories", requireAuth, createCategory);
router.put("/admin/categories/:id", requireAuth, updateCategory);
router.delete("/admin/categories/:id", requireAuth, deleteCategory);

// ADMIN - DESIGNS
router.get("/admin/designs", requireAuth, getAdminDesigns);
router.post("/admin/designs", requireAuth, createDesign);
router.put("/admin/designs/:id", requireAuth, updateDesign);
router.delete("/admin/designs/:id", requireAuth, deleteDesign);

// ADMIN - FAQ
router.get("/admin/faqs", requireAuth, getAdminFAQs);
router.post("/admin/faqs", requireAuth, createFAQ);
router.put("/admin/faqs/:id", requireAuth, updateFAQ);
router.delete("/admin/faqs/:id", requireAuth, deleteFAQ);

// ADMIN - IMAGE UPLOAD
router.post(
  "/admin/upload-images",
  requireAuth,
  upload.array("images", 20),
  uploadDesignImages,
);

export default router;

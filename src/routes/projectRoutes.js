import express from "express";
import upload from "../upload.js";

import {
  getPublicProjects,
  getPublicProjectBySlug,
  getAdminProjects,
  createProject,
  updateProject,
  deleteProject,
  updateProjectStatus,
  reorderProjects,
  uploadProjectAssets,
} from "../controllers/projectController.js";

// Replace this import with your existing auth middleware.
import { requireAuth } from "../auth.js";
import { uploadImages } from "../storage.js";

const router = express.Router();

router.use(requireAuth);

// Admin routes
router.get("/", getAdminProjects);
router.post("/", createProject);
router.put("/:id", updateProject);
router.delete("/:id", deleteProject);

router.patch("/:id/status", updateProjectStatus);

router.patch("/reorder", reorderProjects);

router.post(
  "/upload",

  requireAuth,
  uploadImages.array("images", 30),
  uploadProjectAssets,
);

export default router;

import { Router } from "express";
import multer from "multer";

import { requireAuth } from "../auth.js";
import { Carousel } from "../models.js";
import { ah, HttpError, isHttpUrl } from "../utils.js";
import { saveImage, sniffImage } from "../storage.js";

const router = Router();

router.use(requireAuth);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 8 * 1024 * 1024,
    files: 1,
  },
});

const carouselData = (body, imageUrl) => {
  const title = String(body.title || "").trim();
  const header = String(body.header || "").trim();
  const subHeader = String(body.subHeader || "").trim();

  if (!title) {
    throw new HttpError(400, "Carousel title is required");
  }

  if (!header) {
    throw new HttpError(400, "Carousel header is required");
  }

  if (!subHeader) {
    throw new HttpError(400, "Carousel subheader is required");
  }

  if (title.length > 200) {
    throw new HttpError(400, "Carousel title is too long");
  }

  if (header.length > 200) {
    throw new HttpError(400, "Carousel header is too long");
  }

  if (subHeader.length > 500) {
    throw new HttpError(400, "Carousel subheader is too long");
  }

  const sortOrder = Number.parseInt(body.sortOrder, 10) || 0;

  return {
    title,
    header,
    subHeader,
    sortOrder,
    isActive: body.published !== false && body.published !== "false",
    ...(imageUrl ? { image: imageUrl } : {}),
  };
};

// GET /carousels — admin: list all slides
router.get(
  "/carousels",
  ah(async (req, res) => {
    const slides = await Carousel.findAll({
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
    });

    res.json(slides);
  }),
);

// GET /carousels/:id — admin: get one slide
router.get(
  "/carousels/:id",
  ah(async (req, res) => {
    const slide = await Carousel.findByPk(req.params.id);

    if (!slide) {
      throw new HttpError(404, "Carousel slide not found");
    }

    res.json(slide);
  }),
);

// POST /carousels — admin: create a slide
router.post(
  "/carousels",
  ah(async (req, res) => {
    const data = carouselData(req.body, req.body.image);

    if (!data.image || !isHttpUrl(data.image)) {
      throw new HttpError(400, "Please upload a valid carousel image first");
    }

    const slide = await Carousel.create(data);

    res.status(201).json(slide);
  }),
);

// PUT /carousels/:id — admin: update a slide
router.put(
  "/carousels/:id",
  ah(async (req, res) => {
    const slide = await Carousel.findByPk(req.params.id);

    if (!slide) {
      throw new HttpError(404, "Carousel slide not found");
    }

    const body = {
      ...slide.toJSON(),
      ...req.body,
    };

    const imageUrl = req.body.image || slide.image;
    const data = carouselData(body, imageUrl);

    if (!data.image || !isHttpUrl(data.image)) {
      throw new HttpError(400, "A valid carousel image is required");
    }

    await slide.update(data);

    res.json(slide);
  }),
);

// PATCH /carousels/:id/published — publish/unpublish
router.patch(
  "/carousels/:id/published",
  ah(async (req, res) => {
    const slide = await Carousel.findByPk(req.params.id);
    if (!slide) {
      throw new HttpError(404, "Carousel slide not found");
    }

    if (typeof req.body.published !== "boolean") {
      throw new HttpError(400, "published must be a boolean");
    }

    await slide.update({
      isActive: req.body.published,
    });

    res.json(slide);
  }),
);

// DELETE /carousels/:id — admin: delete a slide
router.delete(
  "/carousels/:id",
  ah(async (req, res) => {
    const slide = await Carousel.findByPk(req.params.id);

    if (!slide) {
      throw new HttpError(404, "Carousel slide not found");
    }

    await slide.destroy();

    res.json({ ok: true });
  }),
);

// POST /carousels/:id/image — admin: upload/replace image
router.post(
  "/carousels/:id/image",
  upload.single("file"),
  ah(async (req, res) => {
    const slide = await Carousel.findByPk(req.params.id);

    if (!slide) {
      throw new HttpError(404, "Carousel slide not found");
    }

    if (!req.file) {
      throw new HttpError(400, "Choose an image to upload");
    }

    const kind = sniffImage(req.file.buffer);

    if (!kind) {
      throw new HttpError(400, "Only JPG, PNG, GIF or WebP images are allowed");
    }

    const url = await saveImage(req.file.buffer, kind);

    await slide.update({ image: url });

    res.json(slide);
  }),
);

export default router;

import { Op } from "sequelize";
import { Review } from "../models.js";

const cleanReviewInput = (body = {}) => {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const role = typeof body.role === "string" ? body.role.trim() : "";
  const review = typeof body.review === "string" ? body.review.trim() : "";
  const rating = Number(body.rating ?? 5);
  const sortOrder = Number(body.sortOrder ?? 0);

  if (name.length < 2 || name.length > 120) {
    return { error: "Name must be between 2 and 120 characters." };
  }
  if (role.length > 120) {
    return { error: "Role must be 120 characters or fewer." };
  }
  if (review.length < 5 || review.length > 2000) {
    return { error: "Review must be between 5 and 2000 characters." };
  }
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return { error: "Rating must be an integer from 1 to 5." };
  }
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 1000000) {
    return { error: "Sort order must be a non-negative integer." };
  }

  return {
    value: {
      name,
      role,
      review,
      rating,
      sortOrder,
      isActive: body.isActive === true || body.isActive === "true",
    },
  };
};

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/admin/reviews
export const getAdminReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.findAll({
    order: [
      ["sortOrder", "ASC"],
      ["updatedAt", "DESC"],
    ],
  });
  res.json({ reviews });
});

// GET /api/admin/reviews/:id
export const getAdminReview = asyncHandler(async (req, res) => {
  const review = await Review.findByPk(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found." });
  res.json({ review });
});

// POST /api/admin/reviews
export const createReview = asyncHandler(async (req, res) => {
  const parsed = cleanReviewInput(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });

  const review = await Review.create(parsed.value);
  res.status(201).json({ message: "Review created.", review });
});

// PUT /api/admin/reviews/:id
export const updateReview = asyncHandler(async (req, res) => {
  const existing = await Review.findByPk(req.params.id);
  if (!existing) return res.status(404).json({ message: "Review not found." });

  const parsed = cleanReviewInput(req.body);
  if (parsed.error) return res.status(400).json({ message: parsed.error });

  await existing.update(parsed.value);
  res.json({ message: "Review updated.", review: existing });
});

// PATCH /api/admin/reviews/:id/published
export const toggleReviewPublished = asyncHandler(async (req, res) => {
  const review = await Review.findByPk(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found." });

  if (typeof req.body.isActive !== "boolean") {
    return res.status(400).json({ message: "isActive must be true or false." });
  }

  await review.update({ isActive: req.body.isActive });
  res.json({
    message: review.isActive ? "Review published." : "Review unpublished.",
    review,
  });
});

// DELETE /api/admin/reviews/:id
export const deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findByPk(req.params.id);
  if (!review) return res.status(404).json({ message: "Review not found." });

  await review.destroy();
  res.json({ message: "Review deleted." });
});

// GET /api/public/reviews
export const getPublicReviews = asyncHandler(async (_req, res) => {
  const reviews = await Review.findAll({
    where: { isActive: true },
    attributes: [
      "id",
      "name",
      "role",
      "rating",
      "review",
      "sortOrder",
      "createdAt",
    ],
    order: [
      ["sortOrder", "ASC"],
      ["createdAt", "DESC"],
    ],
  });
  res.json({ reviews });
});

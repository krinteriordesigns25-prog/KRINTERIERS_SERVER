import { FAQ } from "../models.js";

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const validateFAQ = (body = {}) => {
  const question =
    typeof body.question === "string" ? body.question.trim() : "";
  const answer = typeof body.answer === "string" ? body.answer.trim() : "";
  const sortOrder = Number(body.sortOrder ?? 0);

  if (!question || question.length > 500) {
    return { error: "Question is required (maximum 500 characters)." };
  }

  if (!answer) {
    return { error: "Answer is required." };
  }

  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 1000000) {
    return { error: "Sort order must be a non-negative integer." };
  }

  return {
    value: {
      question,
      answer,
      sortOrder,
      isActive: body.isActive === true || body.isActive === "true",
    },
  };
};

// Public website: published FAQs only
export const getPublicFAQs = asyncHandler(async (_req, res) => {
  const faqs = await FAQ.findAll({
    where: { isActive: true },
    attributes: ["id", "question", "answer", "isActive", "sortOrder"],
    order: [
      ["sortOrder", "ASC"],
      ["id", "ASC"],
    ],
  });

  res.json({ faqs });
});

// CMS: all FAQs
export const getAdminFAQs = asyncHandler(async (_req, res) => {
  const faqs = await FAQ.findAll({
    order: [
      ["sortOrder", "ASC"],
      ["id", "DESC"],
    ],
  });

  res.json({ faqs });
});

export const createFAQ = asyncHandler(async (req, res) => {
  const parsed = validateFAQ(req.body);

  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  const faq = await FAQ.create(parsed.value);

  res.status(201).json({ message: "FAQ created.", faq });
});

export const updateFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByPk(req.params.id);

  if (!faq) {
    return res.status(404).json({ message: "FAQ not found." });
  }

  const parsed = validateFAQ(req.body);

  if (parsed.error) {
    return res.status(400).json({ message: parsed.error });
  }

  await faq.update(parsed.value);

  res.json({ message: "FAQ updated.", faq });
});

export const deleteFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByPk(req.params.id);

  if (!faq) {
    return res.status(404).json({ message: "FAQ not found." });
  }

  await faq.destroy();

  res.json({ message: "FAQ deleted." });
});

export const toggleFAQ = asyncHandler(async (req, res) => {
  const faq = await FAQ.findByPk(req.params.id);

  if (!faq) {
    return res.status(404).json({ message: "FAQ not found." });
  }

  if (typeof req.body.isActive !== "boolean") {
    return res.status(400).json({
      message: "isActive must be true or false.",
    });
  }

  await faq.update({ isActive: req.body.isActive });

  res.json({ message: "FAQ status updated.", faq });
});

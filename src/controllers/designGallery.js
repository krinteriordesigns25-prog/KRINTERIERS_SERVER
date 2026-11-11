import { DesignCategory, DesignGallery, DesignFAQ } from "../models.js";

import { Op } from "sequelize";
import slugify from "slugify";

// Use your existing image utility.
// Adjust this import path to match your project.
import { saveImage, sniffImage } from "../storage.js";

const makeSlug = (value) =>
  slugify(value || "", {
    lower: true,
    strict: true,
    trim: true,
  });

const parseArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const uniqueSlug = async (Model, title, excludeId = null) => {
  const base = makeSlug(title) || "design";
  let slug = base;
  let count = 1;

  while (
    await Model.findOne({
      where: {
        slug,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
      },
    })
  ) {
    slug = `${base}-${count++}`;
  }

  return slug;
};

// ==========================================
// IMAGE UPLOAD
// ==========================================

export const uploadDesignImages = async (req, res) => {
  try {
    const files = req.files || [];

    if (!files.length) {
      return res.status(400).json({
        message: "Please select at least one image.",
      });
    }

    const images = [];

    for (const file of files) {
      const kind = sniffImage(file.buffer);

      if (!kind) {
        return res.status(400).json({
          message: `Invalid image file: ${file.originalname}`,
        });
      }

      images.push(await saveImage(file.buffer, kind));
    }

    res.status(200).json({
      message: "Images uploaded successfully.",
      images,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ==========================================
// CATEGORY CRUD
// ==========================================

export const getCategories = async (req, res) => {
  try {
    const categories = await DesignCategory.findAll({
      order: [
        ["sortOrder", "ASC"],
        ["id", "DESC"],
      ],
      include: [
        {
          model: DesignGallery,
          as: "designs",
          attributes: ["id", "title", "status"],
        },
      ],
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicCategories = async (req, res) => {
  try {
    const categories = await DesignCategory.findAll({
      where: { isActive: true },
      order: [["sortOrder", "ASC"]],
      include: [
        {
          model: DesignGallery,
          as: "designs",
          where: { status: "published" },
          required: false,
          attributes: [
            "id",
            "title",
            "slug",
            "style",
            "location",
            "description",
            "coverImage",
            "images",
            "features",
            "suitableFor",
          ],
          order: [["sortOrder", "ASC"]],
        },
        {
          model: DesignFAQ,
          as: "faqs",
          where: { isActive: true },
          required: false,
          attributes: ["id", "question", "answer", "sortOrder"],
        },
      ],
    });

    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { title, description, image, sortOrder, isActive } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ message: "Category title is required." });
    }

    const category = await DesignCategory.create({
      title: title.trim(),
      slug: await uniqueSlug(DesignCategory, title),
      description,
      image,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive ?? true,
    });

    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await DesignCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    const { title, description, image, sortOrder, isActive } = req.body;

    const data = {
      description,
      image,
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive ?? category.isActive,
    };

    if (title?.trim()) {
      data.title = title.trim();
      data.slug = await uniqueSlug(DesignCategory, title, category.id);
    }

    await category.update(data);
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await DesignCategory.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    await category.destroy();

    res.json({ message: "Category deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// DESIGN CRUD
// ==========================================

export const getAdminDesigns = async (req, res) => {
  try {
    const designs = await DesignGallery.findAll({
      include: [
        {
          model: DesignCategory,
          as: "category",
          attributes: ["id", "title"],
        },
      ],
      order: [
        ["sortOrder", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json(designs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicDesigns = async (req, res) => {
  try {
    const where = { status: "published" };

    if (req.query.category) {
      where.categoryId = req.query.category;
    }

    const designs = await DesignGallery.findAll({
      where,
      include: [
        {
          model: DesignCategory,
          as: "category",
          attributes: ["id", "title", "slug"],
        },
      ],
      order: [
        ["sortOrder", "ASC"],
        ["createdAt", "DESC"],
      ],
    });

    res.json(designs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPublicDesignBySlug = async (req, res) => {
  try {
    const design = await DesignGallery.findOne({
      where: {
        slug: req.params.slug,
        status: "published",
      },
      include: [
        {
          model: DesignCategory,
          as: "category",
          attributes: ["id", "title", "slug"],
        },
      ],
    });

    if (!design) {
      return res.status(404).json({ message: "Design not found." });
    }

    res.json(design);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createDesign = async (req, res) => {
  try {
    const {
      categoryId,
      title,
      style,
      location,
      description,
      coverImage,
      images,
      features,
      suitableFor,
      sortOrder,
      status,
    } = req.body;

    if (!categoryId || !title?.trim()) {
      return res.status(400).json({
        message: "Category and design title are required.",
      });
    }

    const category = await DesignCategory.findByPk(categoryId);

    if (!category) {
      return res.status(400).json({ message: "Invalid category." });
    }

    const design = await DesignGallery.create({
      categoryId,
      title: title.trim(),
      slug: await uniqueSlug(DesignGallery, title),
      style,
      location,
      description,
      coverImage,
      images: parseArray(images),
      features: parseArray(features),
      suitableFor: parseArray(suitableFor),
      sortOrder: Number(sortOrder) || 0,
      status: status === "published" ? "published" : "draft",
    });

    res.status(201).json(design);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateDesign = async (req, res) => {
  try {
    const design = await DesignGallery.findByPk(req.params.id);

    if (!design) {
      return res.status(404).json({ message: "Design not found." });
    }

    const {
      categoryId,
      title,
      style,
      location,
      description,
      coverImage,
      images,
      features,
      suitableFor,
      sortOrder,
      status,
    } = req.body;

    if (categoryId) {
      const category = await DesignCategory.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ message: "Invalid category." });
      }
    }

    const data = {
      categoryId,
      style,
      location,
      description,
      coverImage,
      sortOrder: Number(sortOrder) || 0,
      status: status === "published" ? "published" : "draft",
    };

    if (title?.trim()) {
      data.title = title.trim();
      data.slug = await uniqueSlug(DesignGallery, title, design.id);
    }

    if (images !== undefined) data.images = parseArray(images);
    if (features !== undefined) data.features = parseArray(features);
    if (suitableFor !== undefined) data.suitableFor = parseArray(suitableFor);

    await design.update(data);

    res.json(design);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteDesign = async (req, res) => {
  try {
    const design = await DesignGallery.findByPk(req.params.id);

    if (!design) {
      return res.status(404).json({ message: "Design not found." });
    }

    await design.destroy();

    res.json({ message: "Design deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ==========================================
// FAQ CRUD
// ==========================================

export const getAdminFAQs = async (req, res) => {
  try {
    const faqs = await DesignFAQ.findAll({
      include: [
        {
          model: DesignCategory,
          as: "category",
          attributes: ["id", "title"],
        },
      ],
      order: [["sortOrder", "ASC"]],
    });

    res.json(faqs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createFAQ = async (req, res) => {
  try {
    const { categoryId, question, answer, sortOrder, isActive } = req.body;

    if (!categoryId || !question?.trim() || !answer?.trim()) {
      return res.status(400).json({
        message: "Category, question and answer are required.",
      });
    }

    const faq = await DesignFAQ.create({
      categoryId,
      question: question.trim(),
      answer: answer.trim(),
      sortOrder: Number(sortOrder) || 0,
      isActive: isActive ?? true,
    });

    res.status(201).json(faq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateFAQ = async (req, res) => {
  try {
    const faq = await DesignFAQ.findByPk(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found." });
    }

    await faq.update(req.body);
    res.json(faq);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteFAQ = async (req, res) => {
  try {
    const faq = await DesignFAQ.findByPk(req.params.id);

    if (!faq) {
      return res.status(404).json({ message: "FAQ not found." });
    }

    await faq.destroy();
    res.json({ message: "FAQ deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

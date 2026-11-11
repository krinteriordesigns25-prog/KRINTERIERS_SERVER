import { Router } from "express";
import { Carousel, Menu, Page, Review } from "../models.js";
import { ah } from "../utils.js";
import { getPublicFAQs } from "../controllers/faqController.js";
import {
  getPublicProjectBySlug,
  getPublicProjects,
} from "../controllers/projectController.js";

const router = Router();

// Used by the website navbar: menus with their published submenu pages
router.get(
  "/menus",
  ah(async (req, res) => {
    const menus = await Menu.findAll({
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
        [{ model: Page, as: "pages" }, "sortOrder", "ASC"],
        [{ model: Page, as: "pages" }, "id", "ASC"],
      ],
      include: [
        {
          model: Page,
          as: "pages",
          where: { published: true },
          required: false,
          attributes: ["id", "title", "slug"],
        },
      ],
    });
    res.json(
      menus.map((m) => ({
        id: m.id,
        title: m.title,
        submenus: m.pages.map((p) => ({
          id: p.id,
          title: p.title,
          slug: p.slug,
        })),
      })),
    );
  }),
);
router.get(
  "/carousels",
  ah(async (req, res) => {
    const slides = await Carousel.findAll({
      where: { isActive: true },
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
    });

    res.json(slides);
  }),
);
router.get("/faq", getPublicFAQs);

router.get(
  "/reviewsall",
  ah(async (req, res) => {
    const slides = await Review.findAll({
      where: { isActive: true },
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
    });

    res.json(slides);
  }),
);
// Used by the website submenu page
router.get(
  "/pages/:slug",
  ah(async (req, res) => {
    const page = await Page.findOne({
      where: { slug: req.params.slug, published: true },
      include: [{ model: Menu, as: "menu", attributes: ["title"] }],
    });
    if (!page) return res.status(404).json({ message: "Page not found" });
    res.json({
      id: page.id,
      title: page.title,
      subtitle: page.subtitle || "",
      content: page.content || "",
      image: page.headerImage || "",
      images: page.images || [],
      parent: page.menu?.title || "",
      updatedAt: page.updatedAt,
    });
  }),
);
// Public routes
router.get("/project", getPublicProjects);
router.get("/project/:slug", getPublicProjectBySlug);
export default router;

import { Router } from "express";
import multer from "multer";
import { requireAuth, changePassword } from "../auth.js";
import { Menu, Page } from "../models.js";
import { ah, HttpError, uniqueSlug, cleanHtml, isHttpUrl } from "../utils.js";
import { saveImage, sniffImage } from "../storage.js";

const router = Router();
router.use(requireAuth);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

router.post("/change-password", ah(changePassword));

/* ------------------------------ Menus ------------------------------ */
const menuData = (b) => {
  const title = String(b.title || "").trim();
  if (!title) throw new HttpError(400, "Menu title is required");
  if (title.length > 120) throw new HttpError(400, "Menu title is too long");
  return { title, sortOrder: parseInt(b.sortOrder, 10) || 0 };
};
const sameTitle = async (title, exceptId) => {
  const hit = await Menu.findOne({ where: { title } });
  if (hit && hit.id !== exceptId)
    throw new HttpError(409, "A menu with this title already exists");
};

router.get(
  "/menus",
  ah(async (req, res) => {
    const menus = await Menu.findAll({
      order: [
        ["sortOrder", "ASC"],
        ["id", "ASC"],
      ],
      include: [{ model: Page, as: "pages", attributes: ["id"] }],
    });
    res.json(
      menus.map((m) => ({
        id: m.id,
        title: m.title,
        sortOrder: m.sortOrder,
        pageCount: m.pages.length,
      })),
    );
  }),
);
router.post(
  "/menus",
  ah(async (req, res) => {
    const data = menuData(req.body);
    await sameTitle(data.title);
    res.status(201).json(await Menu.create(data));
  }),
);
router.put(
  "/menus/:id",
  ah(async (req, res) => {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) throw new HttpError(404, "Menu not found");
    const data = menuData(req.body);
    await sameTitle(data.title, menu.id);
    res.json(await menu.update(data));
  }),
);
router.delete(
  "/menus/:id",
  ah(async (req, res) => {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) throw new HttpError(404, "Menu not found");
    const count = await Page.count({ where: { menuId: menu.id } });
    if (count > 0)
      throw new HttpError(
        409,
        `This menu still has ${count} page(s). Move or delete them first.`,
      );
    await menu.destroy();
    res.json({ ok: true });
  }),
);

/* ------------------------------ Pages ------------------------------ */
async function pageData(b, excludeId) {
  const title = String(b.title || "").trim();
  if (!title) throw new HttpError(400, "Title is required");
  const menuId = parseInt(b.menuId, 10);
  if (!menuId || !(await Menu.findByPk(menuId)))
    throw new HttpError(400, "Please choose a valid menu");
  const headerImage = String(b.headerImage || "").trim();
  const images = (Array.isArray(b.images) ? b.images : [])
    .map((s) => String(s).trim())
    .filter(Boolean)
    .slice(0, 40);
  if (
    (headerImage && !isHttpUrl(headerImage)) ||
    images.some((u) => !isHttpUrl(u))
  )
    throw new HttpError(400, "Image links must start with http:// or https://");
  return {
    title: title.slice(0, 200),
    slug: await uniqueSlug(b.slug, title, excludeId),
    subtitle: String(b.subtitle || "")
      .trim()
      .slice(0, 400),
    content: cleanHtml(b.content),
    headerImage,
    images,
    menuId,
    published: b.published !== false && b.published !== "false",
    sortOrder: parseInt(b.sortOrder, 10) || 0,
  };
}
const withMenu = [{ model: Menu, as: "menu", attributes: ["id", "title"] }];

router.get(
  "/pages",
  ah(async (req, res) => {
    res.json(
      await Page.findAll({
        attributes: { exclude: ["content"] },
        include: withMenu,
        order: [
          ["menuId", "ASC"],
          ["sortOrder", "ASC"],
          ["id", "ASC"],
        ],
      }),
    );
  }),
);
router.get(
  "/pages/:id",
  ah(async (req, res) => {
    const page = await Page.findByPk(req.params.id, { include: withMenu });
    if (!page) throw new HttpError(404, "Page not found");
    res.json(page);
  }),
);
router.post(
  "/pages",
  ah(async (req, res) => {
    res.status(201).json(await Page.create(await pageData(req.body)));
  }),
);
router.put(
  "/pages/:id",
  ah(async (req, res) => {
    const page = await Page.findByPk(req.params.id);
    if (!page) throw new HttpError(404, "Page not found");
    res.json(await page.update(await pageData(req.body, page.id)));
  }),
);
router.patch(
  "/pages/:id/published",
  ah(async (req, res) => {
    const page = await Page.findByPk(req.params.id);
    if (!page) throw new HttpError(404, "Page not found");
    res.json(await page.update({ published: !!req.body.published }));
  }),
);
router.delete(
  "/pages/:id",
  ah(async (req, res) => {
    const page = await Page.findByPk(req.params.id);
    if (!page) throw new HttpError(404, "Page not found");
    await page.destroy();
    res.json({ ok: true });
  }),
);

/* ------------------------------ Images ------------------------------ */
router.post(
  "/upload",
  upload.single("file"),
  ah(async (req, res) => {
    if (!req.file) throw new HttpError(400, "Choose an image to upload");
    const kind = sniffImage(req.file.buffer);
    if (!kind)
      throw new HttpError(400, "Only JPG, PNG, GIF or WebP images are allowed");
    res.status(201).json({ url: await saveImage(req.file.buffer, kind) });
  }),
);

export default router;

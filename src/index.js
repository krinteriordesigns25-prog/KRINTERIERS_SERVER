import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { sequelize } from "./db.js";
import path from "path";

import "./models.js";
import { login, jwtSecret } from "./auth.js";
import { uploadDir } from "./storage.js";
import { ensureAdmin, seedDemo } from "./seed.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import carouselRoutes from "./routes/carouselRoutes.js";
import reviewsRouters from "./routes/reviewsRouters.js";
import projectRoutes from "./routes/projectRoutes.js";
import faqRouters from "./routes/faqRoutes.js";
import designGalleryRoutes from "./routes/designGalleryRoutes.js";

import { ah } from "./utils.js";

jwtSecret(); // fail fast if .env is not set up

const app = express();
const origins = (
  process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } })); // lets the website show images served from /uploads
app.use(cors({ origin: origins }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static(uploadDir, { maxAge: "7d", index: false }));
app.use("/uploads", express.static(path.resolve("uploads")));
app.get("/api/health", (req, res) => res.json({ ok: true }));
app.post(
  "/api/auth/login",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many login attempts. Try again in 15 minutes." },
  }),
  ah(login),
);
app.use("/api", publicRoutes); // GET /api/menus, GET /api/pages/:slug   (website)
app.use("/api/admin", adminRoutes); // protected create / read / update / delete (admin panel)
app.use("/api/carousels", carouselRoutes);
app.use("/api/reviews", reviewsRouters);
app.use("/api/faq", faqRouters);
app.use("/api/projects", projectRoutes);

app.use("/api/design-gallery", designGalleryRoutes);

app.use((req, res) => res.status(404).json({ message: "Not found" }));
app.use((err, req, res, next) => {
  // eslint-disable-line no-unused-vars
  if (err.code === "LIMIT_FILE_SIZE")
    return res.status(400).json({ message: "Image is too large (max 8 MB)" });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? "Something went wrong on the server" : err.message,
  });
});

await sequelize.sync();
await ensureAdmin();
await seedDemo();
const port = Number(process.env.PORT) || 5000;
app.listen(port, () =>
  console.log(`CMS API running on http://localhost:${port}`),
);

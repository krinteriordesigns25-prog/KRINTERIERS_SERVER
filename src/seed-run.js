import "dotenv/config";
import { sequelize } from "./db.js";
import { User, Menu, Page, Carousel, Review } from "./models.js";
import { ensureAdmin, seedDemo } from "./seed.js";

console.log(
  "DB_DIALECT      :",
  process.env.DB_DIALECT || "(not set, using sqlite)",
);
console.log("DB_NAME         :", process.env.DB_NAME || "(not set)");
console.log("ADMIN_EMAIL     :", process.env.ADMIN_EMAIL || "(NOT SET)");
console.log(
  "ADMIN_PASSWORD  :",
  (process.env.ADMIN_PASSWORD || "").length,
  "characters (needs 8+)",
);
console.log(
  "SEED_DEMO       :",
  process.env.SEED_DEMO || "(not set, defaults to true)",
);
console.log(
  "Before -> users:",
  await User.count(),
  " menus:",
  await Menu.count(),
  " pages:",
  await Page.count(),
);

await sequelize.sync();
await ensureAdmin();
await seedDemo();

console.log(
  "After  -> users:",
  await User.count(),
  " menus:",
  await Menu.count(),
  " pages:",
  await Page.count(),
);
await sequelize.close();

import bcrypt from "bcryptjs";
import { User, Menu, Page } from "./models.js";

export async function ensureAdmin() {
  if (await User.count()) return;
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  if (!email || password.length < 8) {
    console.warn(
      "No admin user yet. Set ADMIN_EMAIL and ADMIN_PASSWORD (8+ characters) in .env and restart.",
    );
    return;
  }
  await User.create({ email, passwordHash: await bcrypt.hash(password, 12) });
  console.log(`Admin user created: ${email}`);
}

const img = (id) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;
const body =
  "<p>We begin every project by listening. Your lifestyle and routines shape every decision we make, from the layout to the final accessories.</p><h3>Materials that last</h3><p>We select durable finishes, warm woods and soft fabrics that look beautiful today and still feel right years from now.</p><ul><li>Space planning and 3D visuals</li><li>Custom furniture and joinery</li><li>Lighting, colour and styling</li></ul>";

export async function seedDemo() {
  if (process.env.SEED_DEMO === "false" || (await Menu.count())) return;
  const about = await Menu.create({ title: "About Us", sortOrder: 1 });
  const services = await Menu.create({ title: "Services", sortOrder: 2 });
  await Menu.create({ title: "Gallery", sortOrder: 3 });
  await Page.bulkCreate([
    {
      menuId: about.id,
      title: "Our Story",
      slug: "our-story",
      subtitle: "How KRinterior started and what we believe in.",
      content: body,
      headerImage: img("photo-1600607687939-ce8a6c25118c"),
      images: [
        img("photo-1600210492486-724fe5c67fb0"),
        img("photo-1616486338812-3dadae4b4ace"),
      ],
      sortOrder: 1,
    },
    {
      menuId: services.id,
      title: "Residential Design",
      slug: "residential-design",
      subtitle: "Stylish, comfortable homes tailored to your lifestyle.",
      content: body,
      headerImage: img("photo-1616486338812-3dadae4b4ace"),
      images: [img("photo-1600607687939-ce8a6c25118c")],
      sortOrder: 1,
    },
    {
      menuId: services.id,
      title: "Modular Kitchen",
      slug: "modular-kitchen",
      subtitle: "Beautiful and efficient kitchens for everyday living.",
      content: body,
      headerImage: img("photo-1600607687920-4e2a09cf159d"),
      images: [],
      sortOrder: 2,
    },
  ]);
  console.log("Demo menus and pages created.");
}

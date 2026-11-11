import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { User } from "./models.js";

export function jwtSecret() {
  const s = process.env.JWT_SECRET;
  if (!s || s.length < 16)
    throw new Error(
      "JWT_SECRET is missing. Set a long random value in server/.env",
    );
  return s;
}

export function requireAuth(req, res, next) {
  const h = req.headers.authorization || "";
  const token = h.startsWith("Bearer ") ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Please log in" });
  try {
    req.user = jwt.verify(token, jwtSecret());
    next();
  } catch {
    res.status(401).json({ message: "Session expired, please log in again" });
  }
}

export async function login(req, res) {
  const email = String(req.body?.email || "")
    .toLowerCase()
    .trim();
  const password = String(req.body?.password || "");
  const user = await User.findOne({ where: { email } });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok)
    return res.status(401).json({ message: "Invalid email or password" });
  res.json({
    token: jwt.sign({ id: user.id, email: user.email }, jwtSecret(), {
      expiresIn: "12h",
    }),
    email: user.email,
  });
}

export async function changePassword(req, res) {
  const { currentPassword, newPassword } = req.body || {};
  const user = await User.findByPk(req.user.id);
  if (
    !user ||
    !(await bcrypt.compare(String(currentPassword || ""), user.passwordHash))
  )
    return res.status(400).json({ message: "Current password is wrong" });
  if (String(newPassword || "").length < 8)
    return res
      .status(400)
      .json({ message: "New password must be at least 8 characters" });
  user.passwordHash = await bcrypt.hash(String(newPassword), 12);
  await user.save();
  res.json({ ok: true });
}

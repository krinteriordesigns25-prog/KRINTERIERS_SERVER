import sanitizeHtml from "sanitize-html";
import { Page } from "./models.js";

export const ah = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const slugify = (s) =>
  String(s || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

/** Unique slug. Titles with no latin letters (e.g. Tamil) get a generated fallback. */
export async function uniqueSlug(wanted, title, excludeId) {
  let base =
    slugify(wanted) || slugify(title) || `page-${Date.now().toString(36)}`;
  let slug = base,
    n = 2;
  for (;;) {
    const hit = await Page.findOne({ where: { slug } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${base}-${n++}`;
  }
}

/** Rich-text from the editor is cleaned before it is stored. */
export const cleanHtml = (html) =>
  sanitizeHtml(String(html || ""), {
    allowedTags: [
      "h2",
      "h3",
      "h4",
      "p",
      "br",
      "hr",
      "strong",
      "b",
      "em",
      "i",
      "u",
      "s",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
      "img",
      "figure",
      "figcaption",
      "table",
      "thead",
      "tbody",
      "tr",
      "th",
      "td",
      "span",
      "div",
    ],
    allowedAttributes: {
      a: ["href", "title", "target", "rel"],
      img: ["src", "alt", "width", "height"],
      "*": [],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https"] },
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });

export const isHttpUrl = (u) => /^https?:\/\/\S+$/i.test(u);

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import multer from "multer";

import { put } from "@vercel/blob";
import { uploadFile } from "../s3-client.js";

export const uploadDir = path.resolve("./uploads");

// Detect the real image type from the first bytes (the browser-supplied type can be faked)
export function sniffImage(buf) {
  if (buf.length < 12) return null;
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff)
    return { ext: "jpg", type: "image/jpeg" };
  if (
    buf
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  )
    return { ext: "png", type: "image/png" };
  if (buf.subarray(0, 4).toString("ascii") === "GIF8")
    return { ext: "gif", type: "image/gif" };
  if (
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  )
    return { ext: "webp", type: "image/webp" };
  return null;
}

export async function saveImage(buffer, kind) {
  const name = `${crypto.randomUUID()}.${kind.ext}`;

  // Neon Object Storage
  if (process.env.AWS_ACCESS_KEY_ID) {
    await uploadFile(name, buffer, kind.type);

    const endpoint = process.env.AWS_ENDPOINT_URL_S3.replace(/\/$/, "");
    const bucket = process.env.NEON_BUCKET || "images";

    return `${endpoint}/${bucket}/${encodeURIComponent(name)}`;
  }

  // Local development fallback
  await fs.mkdir(uploadDir, { recursive: true });

  await fs.writeFile(path.join(uploadDir, name), buffer);

  return `${(process.env.PUBLIC_URL || "http://localhost:5000").replace(
    /\/$/,
    "",
  )}/uploads/${name}`;
}

/** Saves an uploaded image and returns its public URL (Azure Blob if configured, else local disk). */
export async function saveImageOLD(buffer, kind) {
  const name = `${crypto.randomUUID()}.${kind.ext}`;
  const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
  if (conn) {
    const { BlobServiceClient } = await import("@azure/storage-blob");
    const container = BlobServiceClient.fromConnectionString(
      conn,
    ).getContainerClient(process.env.AZURE_CONTAINER || "cms-images");
    await container.createIfNotExists({ access: "blob" });
    const blob = container.getBlockBlobClient(name);
    await blob.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: kind.type },
    });
    return blob.url;
  }
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, name), buffer);
  return `${(process.env.PUBLIC_URL || "http://localhost:5000").replace(/\/$/, "")}/uploads/${name}`;
}

const storage = multer.memoryStorage();

export const uploadImages = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB per image
    files: 30,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Unsupported image format"));
    }

    cb(null, true);
  },
});

export async function saveImagesBlob(buffer, kind) {
  const name = `${crypto.randomUUID()}.${kind.ext}`;

  // Use Vercel Blob when configured
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(name, buffer, {
      access: "public",
      contentType: kind.type,
      addRandomSuffix: false,
    });

    return blob.url;
  }

  // Local storage fallback
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, name), buffer);

  return `${(process.env.PUBLIC_URL || "http://localhost:5000").replace(
    /\/$/,
    "",
  )}/uploads/${name}`;
}

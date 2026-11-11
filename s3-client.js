import "dotenv/config";

import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

if (
  !process.env.AWS_ACCESS_KEY_ID ||
  !process.env.AWS_SECRET_ACCESS_KEY ||
  !process.env.AWS_ENDPOINT_URL_S3
) {
  throw new Error("Neon Object Storage credentials are missing");
}

export const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export const bucket = process.env.NEON_BUCKET || "images";

// Upload file
export async function uploadFile(key, buffer, contentType) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    }),
  );

  return key;
}

// Generate temporary image URL
export async function getFileUrl(key) {
  return getSignedUrl(
    s3,
    new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
    { expiresIn: 3600 },
  );
}

// Delete file
export async function deleteFile(key) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    }),
  );
}

async function testStorage() {
  try {
    console.log("Connecting to Neon Object Storage...");

    const key = `test/${Date.now()}.txt`;

    await uploadFile(
      key,
      Buffer.from("Hello Neon Object Storage!"),
      "text/plain",
    );

    console.log("Upload successful!");

    const url = await getFileUrl(key);

    console.log("Image/File URL:", url);

    console.log("Neon Object Storage is working!");
  } catch (error) {
    console.error("Storage test failed:", error);
  }
}

testStorage();

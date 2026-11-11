import { saveImage, sniffImage } from "./storage.js";

export async function uploadProjectImages(files = []) {
  const uploadedImages = [];

  for (const file of files) {
    const imageType = sniffImage(file.buffer);

    if (!imageType) {
      throw new Error(`Invalid image file: ${file.originalname}`);
    }

    const imageUrl = await saveImage(file.buffer, imageType);

    uploadedImages.push({
      url: imageUrl,
      name: file.originalname,
      type: imageType.type,
      size: file.size,
    });
  }

  return uploadedImages;
}

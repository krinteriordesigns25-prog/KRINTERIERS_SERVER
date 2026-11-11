import multer from "multer";

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif"];

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP and AVIF images are allowed."));
  }

  cb(null, true);
};

const upload = multer({
  storage: multer.memoryStorage(),

  fileFilter,

  limits: {
    fileSize: 10 * 1024 * 1024,
    files: 30,
  },
});

export default upload;

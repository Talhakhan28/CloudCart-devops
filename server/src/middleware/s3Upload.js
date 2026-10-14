const multer = require("multer");
const crypto = require("crypto");
const path = require("path");
const { S3Client } = require("@aws-sdk/client-s3");
const { Upload } = require("@aws-sdk/lib-storage");

const s3 = new S3Client({
  region: process.env.AWS_REGION || "ap-south-1",
});

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

async function uploadToS3(file) {
  if (!process.env.S3_BUCKET_NAME) {
    throw new Error("S3_BUCKET_NAME is not configured");
  }

  const ext = path.extname(file.originalname).toLowerCase();
  const key = `products/${crypto.randomUUID()}${ext}`;

  await new Upload({
    client: s3,
    params: {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    },
  }).done();

  return key;
}

module.exports = { upload, uploadToS3 };

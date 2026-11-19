const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
} = require('@aws-sdk/client-s3');
const crypto = require('crypto');
const path = require('path');

const region = process.env.AWS_REGION || 'ap-south-1';
const bucketName = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET;

// Initialize AWS S3 Client using AWS SDK v3
const s3Client = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

/**
 * Upload a file buffer directly to AWS S3.
 *
 * @param {Buffer} fileBuffer - The file buffer in memory
 * @param {string} originalname - Original file name
 * @param {string} mimetype - MIME type of the file
 * @param {string} [folder='products'] - Target folder in S3 bucket
 * @returns {Promise<{ url: string, key: string }>} - Object URL and S3 Key
 */
const uploadToS3 = async (fileBuffer, originalname, mimetype, folder = 'products') => {
  if (!bucketName) {
    throw new Error('AWS_S3_BUCKET environment variable is not defined.');
  }

  const ext = path.extname(originalname).toLowerCase();
  const randomHash = crypto.randomBytes(6).toString('hex');
  const sanitizedBase = path
    .basename(originalname, ext)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-');
  const key = `${folder}/${Date.now()}-${randomHash}-${sanitizedBase}${ext}`;

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileBuffer,
    ContentType: mimetype,
  });

  await s3Client.send(command);

  // Use configured public base URL (e.g. CloudFront / custom domain) or standard AWS S3 endpoint
  const publicBaseUrl = process.env.S3_PUBLIC_BASE_URL
    ? process.env.S3_PUBLIC_BASE_URL.replace(/\/+$/, '')
    : `https://${bucketName}.s3.${region}.amazonaws.com`;

  const url = `${publicBaseUrl}/${key}`;

  return { url, key };
};

/**
 * Delete a single object from S3 by key.
 *
 * @param {string} key - S3 object key
 * @returns {Promise<void>}
 */
const deleteFromS3 = async (key) => {
  if (!key || !bucketName) return;

  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  await s3Client.send(command);
};

/**
 * Delete multiple objects from S3 by keys.
 *
 * @param {string[]} keys - Array of S3 object keys
 * @returns {Promise<void>}
 */
const deleteMultipleFromS3 = async (keys) => {
  if (!keys || !keys.length || !bucketName) return;

  const validKeys = keys.filter(Boolean);
  if (!validKeys.length) return;

  const command = new DeleteObjectsCommand({
    Bucket: bucketName,
    Delete: {
      Objects: validKeys.map((key) => ({ Key: key })),
      Quiet: true,
    },
  });

  await s3Client.send(command);
};

module.exports = {
  s3Client,
  uploadToS3,
  deleteFromS3,
  deleteMultipleFromS3,
};

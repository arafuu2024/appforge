const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const path = require("path");
const fs = require("fs-extra");

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "https://148d1aed9c6314656ccb40b337aef354.r2.cloudflarestorage.com",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "3a79f5779245c7edabb4f42173866a651",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "b3ff67163f9c5e00829dc435345341dad4b7fe76a01eb553341b2d21c089bf0"
  },
  // CRITICAL: Set forcePathStyle: true for R2 to work
  forcePathStyle: true
});

const bucketName = process.env.R2_BUCKET_NAME || "web-app-converter";

/**
 * Upload a file to R2 bucket under the builds/ prefix
 * @param {string} buildId - The build ID
 * @param {string} filePath - Local path to the file to upload
 * @param {string} fileName - Name to store the file as in R2 (e.g., "app.apk")
 * @returns {Promise<string>} - The R2 object key (path) of the uploaded file
 */
async function uploadBuild(buildId, filePath, fileName) {
  console.log(`📤 Uploading ${fileName} to R2 bucket ${bucketName} under builds/${buildId}/`);

  const fileContent = await fs.readFile(filePath);

  const key = `builds/${buildId}/${fileName}`;

  await s3Client.send(new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    Body: fileContent,
    // Set content type based on file extension
    ContentType: fileName.endsWith('.apk') ? 'application/vnd.android.package-archive' :
                fileName.endsWith('.aab') ? 'application/octet-stream' :
                'application/octet-stream'
  }));

  console.log(`✅ Uploaded to R2: ${key}`);
  return key;
}

/**
 * Generate a pre-signed URL for downloading a file from R2
 * @param {string} buildId - The build ID
 * @param {string} fileName - The name of the file (e.g., "app.apk")
 * @param {number} expiresIn - Expiration time in seconds (default: 3600 = 1 hour)
 * @returns {Promise<string>} - Pre-signed URL
 */
async function getDownloadUrl(buildId, fileName, expiresIn = 3600) {
  const key = `builds/${buildId}/${fileName}`;

  console.log(`🔗 Generating pre-signed URL for ${key} (expires in ${expiresIn}s)`);

  const url = await getSignedUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key
    }),
    { expiresIn }
  );

  return url;
}

module.exports = {
  uploadBuild,
  getDownloadUrl
};
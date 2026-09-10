import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const region = process.env.AWS_REGION || 'us-east-1';
const bucketName = process.env.AWS_BUCKET_NAME;

const clientConfig = { region };

// Only add explicit credentials if provided; otherwise fallback to EC2 IAM Role
if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  clientConfig.credentials = {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
}

export const s3Client = new S3Client(clientConfig);


/**
 * Upload buffer file to AWS S3 bucket
 * @param {Buffer} fileBuffer 
 * @param {string} fileName 
 * @param {string} mimeType 
 * @returns {Promise<{s3Key: string, s3Url: string}>}
 */
export const uploadFileToS3 = async (fileBuffer, originalName, mimeType) => {
  const ext = path.extname(originalName) || '.jpg';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const s3Key = `uploads/${timestamp}-${randomStr}${ext}`;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: bucketName,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: mimeType,
    },
  });

  await upload.done();

  // AWS S3 standard public URL format
  const s3Url = `https://${bucketName}.s3.${region}.amazonaws.com/${s3Key}`;

  return { s3Key, s3Url };
};

/**
 * Delete object from AWS S3
 * @param {string} s3Key 
 */
export const deleteFileFromS3 = async (s3Key) => {
  if (!s3Key) return;
  const command = new DeleteObjectCommand({
    Bucket: bucketName,
    Key: s3Key,
  });

  await s3Client.send(command);
};

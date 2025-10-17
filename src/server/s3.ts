import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.S3_BUCKET || '';

export interface PresignedUploadUrl {
  uploadUrl: string;
  fileKey: string;
}

export async function generatePresignedUploadUrl(
  fileKey: string,
  contentType: string,
  expiresIn: number = 3600
): Promise<PresignedUploadUrl> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: fileKey,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });

  return {
    uploadUrl,
    fileKey,
  };
}

export function getPublicUrl(fileKey: string): string {
  return `https://${BUCKET_NAME}.s3.${process.env.S3_REGION}.amazonaws.com/${fileKey}`;
}

export function validateMimeType(mimeType: string): boolean {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  return allowedTypes.includes(mimeType);
}

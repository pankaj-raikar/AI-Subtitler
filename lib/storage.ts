// This is a temporary storage implementation
// TODO: Replace with AWS S3 and CloudFront when ready

import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "./prisma"
import logger from "./logger" // Import the logger

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), "uploads")
logger.debug('Initializing storage: uploads directory path', { UPLOADS_DIR })
if (!fs.existsSync(UPLOADS_DIR)) {
  logger.info('Creating uploads directory', { UPLOADS_DIR })
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

// Create a directory for SRT files (Note: This might be redundant if using R2 primarily)
const SRT_DIR = path.join(UPLOADS_DIR, "srt")
logger.debug('Initializing storage: Local SRT directory path (potentially unused)', { SRT_DIR })
if (!fs.existsSync(SRT_DIR)) {
  logger.info('Creating local SRT directory (potentially unused)', { SRT_DIR })
  fs.mkdirSync(SRT_DIR, { recursive: true })
}

// Initialize S3 client for Cloudflare R2
const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
})

/**
 * Save a file to the local filesystem (Consider if this is still needed with R2)
 */
export async function saveFile(buffer: Buffer, fileName: string, userId: string): Promise<string> {
  logger.debug('Saving file locally', { fileName, userId, size: buffer.length })
  const userDir = path.join(UPLOADS_DIR, userId)

  // Create user directory if it doesn't exist
  if (!fs.existsSync(userDir)) {
    logger.debug('Creating user uploads directory locally', { userDir })
    fs.mkdirSync(userDir, { recursive: true })
  }

  const fileId = uuidv4()
  const fileExtension = path.extname(fileName)
  const filePath = path.join(userDir, `${fileId}${fileExtension}`)

  // Write the file
  logger.debug('Writing file to local disk', { filePath, size: buffer.length })
  try {
    fs.writeFileSync(filePath, buffer)
  } catch (error) {
    logger.error('Failed to write file to local disk', { filePath, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
    throw error; // Re-throw the error after logging
  }


  // Return the relative path (used for local access, e.g., by processing.ts)
  const relativePath = `/api/v1/files/${userId}/${fileId}${fileExtension}` // This path format seems specific to local serving
  logger.debug('Local file saved successfully', { relativePath })
  return relativePath
}

/**
 * Save SRT content to Cloudflare R2
 */
export async function saveSRT(content: string, jobId: string, userId: string): Promise<string> {
  logger.debug('Saving SRT file to R2', { jobId, userId, contentLength: content.length })

  try {
    // Get the job details to get the original filename
    logger.debug('Fetching job details to determine SRT filename', { jobId });
    const job = await prisma.conversionJob.findUnique({
      where: { id: jobId },
      select: { fileName: true }
    })

    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    // Create the SRT filename using jobId and original filename
    const originalFileName = path.parse(job.fileName).name
    const srtFileName = `${jobId}/${originalFileName}.srt`

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: srtFileName,
      Body: content,
      ContentType: 'text/plain',
    })

    await s3Client.send(command)
    logger.info('SRT file uploaded to R2 successfully', { jobId, srtFileName })

    // Return the R2 URL
    const downloadUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${srtFileName}`
    logger.debug('Generated R2 download URL', { jobId, downloadUrl })
    return downloadUrl
  } catch (error) {
    logger.error('Failed to upload SRT to R2', { jobId, userId, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    throw error
  }
}

/**
 * Get SRT content from Cloudflare R2
 */
export async function getSRTContent(jobId: string, userId: string): Promise<string> {
  logger.debug('Retrieving SRT content from R2', { jobId, userId })

  try {
    // Get the job details to get the original filename
    logger.debug('Fetching job details to determine SRT filename for retrieval', { jobId });
    const job = await prisma.conversionJob.findUnique({
      where: { id: jobId },
      select: { fileName: true }
    })

    if (!job) {
      throw new Error(`Job ${jobId} not found`)
    }

    // Create the SRT filename using jobId and original filename
    const originalFileName = path.parse(job.fileName).name
    const srtFileName = `${jobId}/${originalFileName}.srt`

    // Get the object from R2
    const command = new GetObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: srtFileName,
    })

    const response = await s3Client.send(command)
    if (!response.Body) {
      throw new Error("No content found in R2 response")
    }

    // Helper function to convert stream to string
    const streamToString = (stream: NodeJS.ReadableStream): Promise<string> =>
      new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on("data", (chunk) => chunks.push(chunk instanceof Buffer ? chunk : Buffer.from(chunk)));
        stream.on("error", reject);
        stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      });

    // Convert the readable stream to string
    const content = await streamToString(response.Body as NodeJS.ReadableStream);


    logger.info('SRT content retrieved successfully from R2', {
      jobId,
      contentLength: content.length
    })
    return content
  } catch (error) {
    logger.error('Failed to retrieve SRT from R2', { jobId, userId, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    throw error
  }
}

/**
 * Delete a file from the local filesystem (Consider if needed with R2)
 */
export async function deleteFile(filePath: string): Promise<void> {
  // filePath here seems to be the relative URL path like /api/v1/files/...
  logger.debug('Attempting to delete local file', { filePath })
  // Construct the actual filesystem path based on the assumed structure
  const fullPath = path.join(process.cwd(), filePath.replace(/^\/api\/v1\/files\//, "uploads/"))
  logger.debug('Constructed full path for local deletion', { fullPath })


  try {
      if (fs.existsSync(fullPath)) {
        logger.debug('Local file exists, attempting deletion', { fullPath })
        fs.unlinkSync(fullPath)
        logger.info('Local file deleted successfully', { fullPath })
      } else {
        logger.warn('Local file not found for deletion', { fullPath })
      }
  } catch (error) {
      logger.error('Failed to delete local file', { fullPath, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
      // Decide if this error should be thrown or just logged
      // throw error; // Uncomment if deletion failure should halt the process
  }
}

// AWS S3 and CloudFront implementation (commented out for later)
/*
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || "";
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN || "";

export async function uploadFile(key: string, body: Buffer, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3Client.send(command);
  return `https://${CLOUDFRONT_DOMAIN}/${key}`;
}

export async function getSignedUploadUrl(key: string, contentType: string, expiresIn = 3600) {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export function getPublicUrl(key: string) {
  return `https://${CLOUDFRONT_DOMAIN}/${key}`;
}
*/

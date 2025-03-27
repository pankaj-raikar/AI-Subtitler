// This is a temporary storage implementation
// TODO: Replace with AWS S3 and CloudFront when ready

import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { prisma } from "./prisma"

// Create uploads directory if it doesn't exist
const UPLOADS_DIR = path.join(process.cwd(), "uploads")
console.log('[DEBUG] Initializing storage: uploads directory path', { UPLOADS_DIR })
if (!fs.existsSync(UPLOADS_DIR)) {
  console.log('[DEBUG] Creating uploads directory')
  fs.mkdirSync(UPLOADS_DIR, { recursive: true })
}

// Create a directory for SRT files
const SRT_DIR = path.join(UPLOADS_DIR, "srt")
console.log('[DEBUG] Initializing storage: SRT directory path', { SRT_DIR })
if (!fs.existsSync(SRT_DIR)) {
  console.log('[DEBUG] Creating SRT directory')
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
 * Save a file to the local filesystem
 */
export async function saveFile(buffer: Buffer, fileName: string, userId: string): Promise<string> {
  console.log('[DEBUG] Saving file', { fileName, userId, size: buffer.length })
  const userDir = path.join(UPLOADS_DIR, userId)

  // Create user directory if it doesn't exist
  if (!fs.existsSync(userDir)) {
    console.log('[DEBUG] Creating user uploads directory', { userDir })
    fs.mkdirSync(userDir, { recursive: true })
  }

  const fileId = uuidv4()
  const fileExtension = path.extname(fileName)
  const filePath = path.join(userDir, `${fileId}${fileExtension}`)

  // Write the file
  console.log('[DEBUG] Writing file to disk', { filePath, size: buffer.length })
  fs.writeFileSync(filePath, buffer)

  // Return the relative path
  const relativePath = `/api/v1/files/${userId}/${fileId}${fileExtension}`
  console.log('[DEBUG] File saved successfully', { relativePath })
  return relativePath
}

/**
 * Save SRT content to Cloudflare R2
 */
export async function saveSRT(content: string, jobId: string, userId: string): Promise<string> {
  console.log('[DEBUG] Saving SRT file to R2', { jobId, userId, contentLength: content.length })
  
  try {
    // Get the job details to get the original filename
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
    console.log('[DEBUG] SRT file uploaded to R2 successfully', { srtFileName })

    // Return the R2 URL
    const downloadUrl = `${process.env.CLOUDFLARE_R2_PUBLIC_URL}/${srtFileName}`
    console.log('[DEBUG] Generated R2 URL', { downloadUrl })
    return downloadUrl
  } catch (error) {
    console.error('[ERROR] Failed to upload SRT to R2:', error)
    throw error
  }
}

/**
 * Get SRT content from Cloudflare R2
 */
export async function getSRTContent(jobId: string, userId: string): Promise<string> {
  console.log('[DEBUG] Retrieving SRT content from R2', { jobId, userId })
  
  try {
    // Get the job details to get the original filename
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

    // Convert the readable stream to string
    const chunks: Uint8Array[] = []
    for await (const chunk of response.Body as any) {
      chunks.push(chunk)
    }
    const content = Buffer.concat(chunks).toString('utf-8')

    console.log('[DEBUG] SRT content retrieved successfully from R2', { 
      jobId, 
      contentLength: content.length 
    })
    return content
  } catch (error) {
    console.error('[ERROR] Failed to retrieve SRT from R2:', error)
    throw error
  }
}

/**
 * Delete a file from the filesystem
 */
export async function deleteFile(filePath: string): Promise<void> {
  console.log('[DEBUG] Deleting file', { filePath })
  const fullPath = path.join(process.cwd(), filePath.replace(/^\/api\/v1\/files\//, "uploads/"))

  if (fs.existsSync(fullPath)) {
    console.log('[DEBUG] File exists, deleting', { fullPath })
    fs.unlinkSync(fullPath)
    console.log('[DEBUG] File deleted successfully')
  } else {
    console.log('[DEBUG] File not found for deletion', { fullPath })
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

// This is a mock implementation of database operations
// In a real application, you would use Prisma to interact with the database

import { v4 as uuidv4 } from "uuid"
import { prisma } from "./prisma"
import logger from "./logger" // Import the logger

type JobStatus = "pending" | "processing" | "completed" | "failed"

interface ConversionJob {
  id: string
  userId: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  language: string
  status: JobStatus
  progress: number
  eta: string | null
  downloadUrl: string | null
  error: string | null
  createdAt: string
  updatedAt: string
}

// In-memory storage for jobs (for demo purposes)
const jobs: ConversionJob[] = []

export async function createConversionJob({
  userId,
  fileName,
  fileSize,
  fileType,
  fileUrl,
  language = "en", // Default to English
}: {
  userId: string
  fileName: string
  fileSize: number
  fileType: string
  fileUrl: string
  language?: string
}): Promise<any> {
  logger.debug("Creating conversion job", { userId, fileName, fileSize, fileType })

  try {
    // First, get or create the user
    logger.debug("Getting or creating user", { clerkId: userId })
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: `${userId}@example.com`, // You might want to get this from Clerk
        name: userId, // You might want to get this from Clerk
      },
    })

    logger.debug("User record ready", { userId: user.id, clerkId: user.clerkId })

    // Now create the conversion job with the correct user ID
    const job = await prisma.conversionJob.create({
      data: {
        id: uuidv4(),
        userId: user.id, // Use the database user ID, not the Clerk ID
        fileName,
        fileSize,
        fileType,
        fileUrl,
        language,
        status: "pending",
        progress: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    })

    logger.debug("Job created successfully in database", { jobId: job.id })
    return job
  } catch (error) {
    logger.error("Failed to create conversion job:", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    throw new Error(`Failed to create conversion job: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function getConversionJob(id: string): Promise<any | null> {
  logger.debug("Fetching job by ID from database", { id })
  try {
    const job = await prisma.conversionJob.findUnique({
      where: { id },
    })
    logger.debug("Job fetch result", { found: !!job })
    return job
  } catch (error) {
    logger.error("Failed to fetch job:", { id, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    throw new Error(`Failed to fetch job: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function getUserJobs(
  userId: string,
  options: { limit: number; offset: number; status?: string },
): Promise<any[]> {
  logger.debug("Fetching user jobs from database", { userId, options })
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    })

    if (!user) {
      throw new Error("User not found")
    }

    const jobs = await prisma.conversionJob.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        user: true, // This will include the related user data
      },
    })

    logger.debug("User jobs fetched from database", { count: jobs.length })
    return jobs
  } catch (error) {
    logger.error("Failed to fetch user jobs:", { userId, options, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    throw new Error(`Failed to fetch user jobs: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function deleteConversionJob(id: string): Promise<void> {
  logger.debug("Deleting job from database", { id })
  try {
    await prisma.conversionJob.delete({
      where: { id },
    })
    logger.debug("Job deleted successfully from database", { id })
  } catch (error) {
    logger.error("Failed to delete job:", { id, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    throw new Error(`Failed to delete job: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function updateConversionJob(
  id: string,
  data: {
    status?: JobStatus
    progress?: number
    error?: string | null
    downloadUrl?: string | null
    updatedAt?: Date
  },
): Promise<any> {
  // Avoid logging potentially large data objects directly unless necessary
  const logData = { ...data };
  if (logData.error && typeof logData.error === 'string' && logData.error.length > 200) {
    logData.error = logData.error.substring(0, 200) + '...'; // Truncate long errors
  }
  logger.debug("Updating job in database", { id, data: logData })
  try {
    const job = await prisma.conversionJob.update({
      where: { id },
      data: {
        ...data,
        updatedAt: data.updatedAt || new Date(),
      },
    })
    logger.debug("Job updated successfully in database", { jobId: job.id })
    return job
  } catch (error) {
    logger.error("Failed to update job:", { id, data: logData, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    throw new Error(`Failed to update job: ${error instanceof Error ? error.message : String(error)}`)
  }
}

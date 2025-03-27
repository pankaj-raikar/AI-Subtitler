// This is a mock implementation of database operations
// In a real application, you would use Prisma to interact with the database

import { v4 as uuidv4 } from "uuid"
import { prisma } from "./prisma"

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
  console.log("[DEBUG] Creating conversion job", { userId, fileName, fileSize, fileType })

  try {
    // First, get or create the user
    console.log("[DEBUG] Getting or creating user", { clerkId: userId })
    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {},
      create: {
        clerkId: userId,
        email: `${userId}@example.com`, // You might want to get this from Clerk
        name: userId, // You might want to get this from Clerk
      },
    })

    console.log("[DEBUG] User record ready", { userId: user.id, clerkId: user.clerkId })

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

    console.log("[DEBUG] Job created successfully in database", { jobId: job.id })
    return job
  } catch (error) {
    console.error("[ERROR] Failed to create conversion job:", error)
    throw new Error(`Failed to create conversion job: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function getConversionJob(id: string): Promise<any | null> {
  console.log("[DEBUG] Fetching job by ID from database", { id })
  try {
    const job = await prisma.conversionJob.findUnique({
      where: { id },
    })
    console.log("[DEBUG] Job fetch result", { found: !!job })
    return job
  } catch (error) {
    console.error("[ERROR] Failed to fetch job:", error)
    throw new Error(`Failed to fetch job: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function getUserJobs(
  userId: string,
  options: { limit: number; offset: number; status?: string },
): Promise<any[]> {
  // console.log("[DEBUG] Fetching user jobs from database", { userId, options })
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

    // console.log("[DEBUG] User jobs fetched from database", { count: jobs.length })
    return jobs
  } catch (error) {
    console.error("[ERROR] Failed to fetch user jobs:", error)
    throw new Error(`Failed to fetch user jobs: ${error instanceof Error ? error.message : String(error)}`)
  }
}

export async function deleteConversionJob(id: string): Promise<void> {
  console.log("[DEBUG] Deleting job from database", { id })
  try {
    await prisma.conversionJob.delete({
      where: { id },
    })
    console.log("[DEBUG] Job deleted successfully from database")
  } catch (error) {
    console.error("[ERROR] Failed to delete job:", error)
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
  console.log("[DEBUG] Updating job in database", { id, data })
  try {
    const job = await prisma.conversionJob.update({
      where: { id },
      data: {
        ...data,
        updatedAt: data.updatedAt || new Date(),
      },
    })
    console.log("[DEBUG] Job updated successfully in database", { jobId: job.id })
    return job
  } catch (error) {
    console.error("[ERROR] Failed to update job:", error)
    throw new Error(`Failed to update job: ${error instanceof Error ? error.message : String(error)}`)
  }
}


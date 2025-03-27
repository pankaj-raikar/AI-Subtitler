import PQueue from "p-queue"
import { processMedia } from "./processing"
import { prisma } from "./prisma"
import { getConversionJob, updateConversionJob } from "./db"

// Create a queue with concurrency and rate limiting
export const queue = new PQueue({
  concurrency: 2, // Process 2 jobs at a time
  interval: 1000, // 1 second interval
  intervalCap: 5, // Max 5 jobs per interval
})

// Create a separate queue for scheduling tasks (e.g., cleanup)
export const scheduler = new PQueue({
  concurrency: 1, // Only run one scheduled task at a time
})

// Track active jobs to prevent duplicate processing
const activeJobs = new Set<string>()

/**
 * Process a conversion job with retry logic
 */
async function processJob(jobId: string) {
  try {
    console.log("[DEBUG] Processing job", { jobId })
    if (activeJobs.has(jobId)) {
      console.log("[DEBUG] Job already active, skipping", { jobId })
      return
    }
    activeJobs.add(jobId)
    console.log("[DEBUG] Added job to active jobs set", { jobId, activeJobsCount: activeJobs.size })

    console.log("[DEBUG] Fetching job from database", { jobId })
    const job = await getConversionJob(jobId)

    if (!job) {
      console.warn(`Job ${jobId} not found, skipping processing`)
      console.log("[DEBUG] Job not found in database", { jobId })
      return
    }

    if (!["pending", "retrying"].includes(job.status)) {
      console.log("[DEBUG] Job status not eligible for processing", { jobId, status: job.status })
      return
    }

    // Update job status to processing
    console.log("[DEBUG] Updating job status to processing", { jobId })
    await updateConversionJob(jobId, {
      status: "processing",
      progress: 0,
    })

    // Process the media file
    console.log("[DEBUG] Starting media processing", { jobId, fileUrl: job.fileUrl })
    await processMedia(jobId, job.fileUrl, job.userId, job.language)

    // Update job status to completed
    await updateConversionJob(jobId, {
      status: "completed",
      progress: 100,
    })

    // Log completion
    console.log(`Job ${jobId} completed successfully`)
    console.log("[DEBUG] Job processing completed", { jobId })
  } catch (error) {
    console.error(`Error processing job ${jobId}:`, error)
    console.log("[DEBUG] Error during job processing", {
      jobId,
      error: error instanceof Error ? error.message : String(error),
    })

    // Update job status to failed
    await updateConversionJob(jobId, {
      status: "failed",
      error: error instanceof Error ? error.message : "Unknown error",
    })
  } finally {
    activeJobs.delete(jobId)
    console.log("[DEBUG] Removed job from active jobs set", { jobId, activeJobsCount: activeJobs.size })
  }
}

// Add a job to the queue
export async function addConversionJob(jobId: string, fileUrl: string, userId: string, language = "en") {
  console.log("[DEBUG] Adding job to queue", {
    jobId,
    userId,
    language,
    queueSize: queue.size,
    activeJobs: activeJobs.size,
    isPaused: queue.isPaused,
  })

  // First check if the job exists in the database
  console.log("[DEBUG] Checking if job exists in database", { jobId })
  const existingJob = await getConversionJob(jobId)

  if (existingJob) {
    // Only add to the queue if job exists in the database
    console.log("[DEBUG] Job exists, adding to processing queue", {
      jobId,
      status: existingJob.status,
      progress: existingJob.progress,
      createdAt: existingJob.createdAt,
    })

    // Check if job is already being processed
    if (activeJobs.has(jobId)) {
      console.log("[DEBUG] Job is already being processed, skipping", { jobId })
      return
    }

    // Add to queue and log queue state
    queue.add(() => processJob(jobId))
    console.log("[DEBUG] Job added to queue successfully", {
      jobId,
      newQueueSize: queue.size,
      activeJobs: activeJobs.size,
    })
  } else {
    console.warn(`Attempted to queue job ${jobId} but it doesn't exist in the database`)
    console.log("[DEBUG] Job not found in database, cannot queue", { jobId })
  }
}

// Resume pending jobs on startup
async function resumePendingJobs() {
  console.log("[DEBUG] Starting to resume pending jobs on startup")
  try {
    const pendingJobs = await prisma.conversionJob.findMany({
      where: {
        status: { in: ["pending", "retrying"] },
      },
      include: {
        user: true, // Include the user relation
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    console.log("[DEBUG] Found pending jobs to resume", {
      count: pendingJobs.length,
      jobs: pendingJobs.map((job) => ({
        id: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        userId: job.userId,
        clerkId: job.user?.clerkId,
      })),
    })

    for (const job of pendingJobs) {
      console.log("[DEBUG] Adding pending job to queue", {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        userId: job.userId,
        clerkId: job.user?.clerkId,
      })
      queue.add(() => processJob(job.id))
    }

    console.log("[DEBUG] Finished resuming pending jobs", {
      queueSize: queue.size,
      activeJobs: activeJobs.size,
    })
  } catch (error) {
    console.error("[ERROR] Failed to resume pending jobs:", error)
    console.log("[DEBUG] Error during job queue initialization", {
      error: error instanceof Error ? error.message : String(error),
      queueSize: queue.size,
      activeJobs: activeJobs.size,
    })
    throw error
  }
}

// Start processing pending jobs when the server starts
console.log("[DEBUG] Initializing job queue")
resumePendingJobs().catch((error) => {
  console.error("Error resuming pending jobs:", error)
  console.log("[DEBUG] Error initializing job queue", { error: error instanceof Error ? error.message : String(error) })
})

// Clean up old jobs (existing implementation remains the same)
export async function cleanupOldJobs() {
  console.log("[DEBUG] Starting cleanup of old jobs")
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  console.log("[DEBUG] Deleting jobs older than 30 days with completed/failed status")
  await prisma.conversionJob.deleteMany({
    where: {
      createdAt: {
        lt: thirtyDaysAgo,
      },
      status: {
        in: ["completed", "failed"],
      },
    },
  })
}

export const worker = {
  close: async () => {
    console.log("Closing queue...")
    await queue.pause()
    await queue.clear()
  },
}


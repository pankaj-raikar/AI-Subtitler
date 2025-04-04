import PQueue from "p-queue"
import { processMedia } from "./processing"
import { prisma } from "./prisma"
import { getConversionJob, updateConversionJob } from "./db"
import logger from "./logger" // Import the logger

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
  logger.info("Processing job", { jobId })
  if (activeJobs.has(jobId)) {
    logger.debug("Job already active, skipping", { jobId })
    return
  }
  activeJobs.add(jobId)
  logger.debug("Added job to active jobs set", { jobId, activeJobsCount: activeJobs.size })

  try {
    logger.debug("Fetching job from database for processing", { jobId })
    const job = await getConversionJob(jobId)

    if (!job) {
      logger.warn(`Job not found in database, skipping processing`, { jobId })
      return
    }

    if (!["pending", "retrying"].includes(job.status)) {
      logger.debug("Job status not eligible for processing, skipping", { jobId, status: job.status })
      return
    }

    // Update job status to processing (already logged inside updateConversionJob)
    await updateConversionJob(jobId, {
      status: "processing",
      progress: 0, // Reset progress when starting
    })

    // Process the media file (logs are inside processMedia)
    await processMedia(jobId, job.fileUrl, job.userId, job.language)

    // Update job status to completed (already logged inside updateConversionJob)
    // Note: processMedia now handles setting the 'completed' status internally on success.
    // If processMedia throws, the catch block below handles the 'failed' status.
    // We might not need this specific update here anymore if processMedia guarantees status update on success.
    // Let's keep it for now as a safeguard, but review if processMedia's logic is robust.
    // Check if the job status was already set to completed by processMedia
    const finalJobState = await getConversionJob(jobId);
    if (finalJobState?.status !== 'completed') {
        logger.warn("Job status was not 'completed' after processMedia finished successfully. Updating now.", { jobId });
        await updateConversionJob(jobId, {
          status: "completed",
          progress: 100,
        });
    }

    logger.info(`Job completed successfully`, { jobId })
  } catch (error) {
    logger.error(`Error processing job`, { jobId, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })

    // Update job status to failed (already logged inside updateConversionJob)
    // Ensure the error message is stored
    try {
        await updateConversionJob(jobId, {
          status: "failed",
          error: error instanceof Error ? error.message : "Unknown processing error",
        });
    } catch (dbUpdateError) {
        logger.error("Failed to update job status to failed in DB after processing error", { jobId, dbUpdateError: dbUpdateError instanceof Error ? dbUpdateError.message : String(dbUpdateError) });
    }
  } finally {
    activeJobs.delete(jobId)
    logger.debug("Removed job from active jobs set", { jobId, activeJobsCount: activeJobs.size })
  }
}

// Add a job to the queue
export async function addConversionJob(jobId: string, fileUrl: string, userId: string, language = "en") {
  logger.debug("Received request to add job to queue", {
    jobId,
    userId,
    language,
    // fileUrl might be sensitive or long, consider omitting or truncating
    queueSize: queue.size,
    activeJobs: activeJobs.size,
    isPaused: queue.isPaused,
  })

  // First check if the job exists in the database (getConversionJob already logs)
  const existingJob = await getConversionJob(jobId)

  if (existingJob) {
    // Only add to the queue if job exists in the database
    logger.debug("Job exists in database, proceeding to queue", {
      jobId,
      status: existingJob.status,
      progress: existingJob.progress,
      createdAt: existingJob.createdAt,
    })

    // Check if job is already being processed
    if (activeJobs.has(jobId)) {
      logger.debug("Job is already active, skipping queue add", { jobId })
      return
    }

    // Add to queue and log queue state
    queue.add(() => processJob(jobId))
    logger.info("Job added to processing queue successfully", {
      jobId,
      newQueueSize: queue.size,
      pendingJobs: queue.pending, // PQueue provides pending count
      activeJobs: activeJobs.size,
    })
  } else {
    logger.warn(`Attempted to queue job but it doesn't exist in the database`, { jobId })
    // No need for the extra debug log here as the warn covers it.
  }
}

// Resume pending jobs on startup
async function resumePendingJobs() {
  logger.info("Starting to resume pending jobs on startup")
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

    logger.info("Found pending jobs to resume", {
      count: pendingJobs.length,
      // Avoid logging full job details unless necessary for debugging startup
      jobIds: pendingJobs.map((job) => job.id),
      // Example of logging more details if needed:
      // jobs: pendingJobs.map((job) => ({
      //   id: job.id,
      //   status: job.status,
      //   progress: job.progress,
      //   createdAt: job.createdAt,
      //   userId: job.userId,
      //   clerkId: job.user?.clerkId,
      // })),
    })

    for (const job of pendingJobs) {
      logger.debug("Adding pending job to queue from startup", {
        jobId: job.id,
        status: job.status,
        progress: job.progress,
        createdAt: job.createdAt,
        userId: job.userId,
        // clerkId: job.user?.clerkId, // Removed duplicate status, progress, userId
      })
      queue.add(() => processJob(job.id))
    }

    logger.info("Finished adding pending jobs to queue", {
      addedCount: pendingJobs.length,
      newQueueSize: queue.size,
      pendingJobs: queue.pending,
      activeJobs: activeJobs.size,
    })
  } catch (error) {
    logger.error("Failed to resume pending jobs during startup", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      queueSize: queue.size,
      activeJobs: activeJobs.size,
    })
    // Depending on severity, you might want to re-throw or handle differently
    throw error
  }
}

// Start processing pending jobs when the server starts
logger.info("Initializing job queue and resuming pending jobs...")
resumePendingJobs().catch((error) => {
  // Error is already logged within resumePendingJobs
  logger.error("Initialization failed: Could not resume pending jobs.", { error: error instanceof Error ? error.message : String(error) })
  // Consider if the application should exit or continue in a degraded state
})

// Clean up old jobs (existing implementation remains the same)
export async function cleanupOldJobs() {
  logger.info("Starting scheduled cleanup of old jobs")
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  logger.debug("Deleting jobs older than 30 days with completed/failed status", { cutoffDate: thirtyDaysAgo.toISOString() })
  try {
      const { count } = await prisma.conversionJob.deleteMany({
        where: {
          createdAt: {
        lt: thirtyDaysAgo,
      },
      status: {
        in: ["completed", "failed"],
          },
        },
      })
      logger.info("Finished cleanup of old jobs", { deletedCount: count })
  } catch (error) {
      logger.error("Error during old job cleanup", { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
  }
}

// Consider adding a scheduled task runner (e.g., node-cron) to call cleanupOldJobs periodically

export const worker = {
  close: async () => {
    logger.info("Closing job queue...")
    await queue.pause()
    logger.debug("Queue paused", { size: queue.size, pending: queue.pending })
    await queue.clear()
    logger.info("Queue cleared")
    // You might also want to wait for active jobs to finish: await queue.onIdle()
  },
}

import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

// Simulating database operations
import { getConversionJob } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  console.log('[DEBUG] Convert status GET request received', { jobId: params.id })
  try {
    // Check authentication
    const { userId } =await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jobId = params.id

    // Get job details
    console.log('[DEBUG] Fetching job details', { jobId })
    const job = await getConversionJob(jobId)

    // Check if job exists
    if (!job) {
      console.log('[DEBUG] Job not found', { jobId })
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if job belongs to user
    if (job.userId !== userId) {
      console.log('[DEBUG] Unauthorized job access attempt', { jobId, requestUserId: userId, jobUserId: job.userId })
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log('[DEBUG] Returning job status', { 
      jobId: job.id, 
      status: job.status, 
      progress: job.progress 
    })
    return NextResponse.json({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      eta: job.eta,
      downloadUrl: job.downloadUrl,
      error: job.error,
    })
  } catch (error) {
    console.error("Error fetching job status:", error)
    return NextResponse.json({ error: "Failed to fetch job status" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { prisma } from "@/lib/prisma"

// Simulating database operations
import { getConversionJob, deleteConversionJob } from "@/lib/db"

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  console.log('[DEBUG] Job DELETE request received', { jobId: await params.id })
  try {
    // Check authentication
    const { userId: clerkId } = await auth()
    console.log('[DEBUG] Clerk User ID', { clerkId })
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the database user ID from Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId }
    })
    
    if (!user) {
      console.log('[DEBUG] User not found in database', { clerkId })
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const jobId = await params.id

    // Get job details
    console.log('[DEBUG] Fetching job details for deletion', { jobId })
    const job = await getConversionJob(jobId)

    // Check if job exists
    if (!job) {
      console.log('[DEBUG] Job not found for deletion', { jobId })
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    // Check if job belongs to user
    if (job.userId !== user.id) {
      console.log('[DEBUG] Unauthorized job deletion attempt', { 
        jobId, 
        requestUserId: user.id, 
        jobUserId: job.userId 
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Delete job
    console.log('[DEBUG] Deleting job', { jobId })
    await deleteConversionJob(jobId)

    console.log('[DEBUG] Job deleted successfully', { jobId })
    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting job:", error)
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 })
  }
}

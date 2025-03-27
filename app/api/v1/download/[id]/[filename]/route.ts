import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import fs from "fs"
import path from "path"
import { getConversionJob } from "@/lib/db"

export async function GET(req: NextRequest, { params }: { params: { id: string; filename: string } }) {
  console.log('[DEBUG] Download GET request received', { jobId: params.id, filename: params.filename })
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const jobId = params.id

    // Get job details to verify ownership
    console.log('[DEBUG] Fetching job details for download', { jobId })
    const job = await getConversionJob(jobId)

    // Check if job exists and belongs to user
    if (!job || job.userId !== userId) {
      console.log('[DEBUG] Job not found or unauthorized access attempt', { 
        jobExists: !!job, 
        requestUserId: userId, 
        jobUserId: job?.userId 
      })
      return NextResponse.json({ error: "Job not found or unauthorized" }, { status: 404 })
    }

    // Check if job is completed
    if (job.status !== "completed") {
      console.log('[DEBUG] Attempted to download incomplete job', { status: job.status })
      return NextResponse.json({ error: "Subtitles not yet available" }, { status: 400 })
    }

    // Get the SRT file path
    const filePath = path.join(process.cwd(), "uploads", "srt", userId, `${jobId}.srt`)
    console.log('[DEBUG] Retrieving SRT file', { filePath })

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('[DEBUG] SRT file not found on disk', { filePath })
      return NextResponse.json({ error: "Subtitle file not found" }, { status: 404 })
    }

    // Get file content
    const fileBuffer = fs.readFileSync(filePath)

    console.log('[DEBUG] Successfully retrieving SRT file', { size: fileBuffer.length })
    // Return the file for download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "text/plain",
        "Content-Disposition": `attachment; filename="${params.filename}"`,
      },
    })
  } catch (error) {
    console.error("Error downloading file:", error)
    return NextResponse.json({ error: "Failed to download file" }, { status: 500 })
  }
}

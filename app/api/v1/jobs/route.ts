import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"

// Simulating database operations
import { getUserJobs } from "@/lib/db"

export async function GET(req: NextRequest) {
  // console.log('[DEBUG] Jobs GET request received')
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get query parameters
    const { searchParams } = new URL(req.url)
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const offset = Number.parseInt(searchParams.get("offset") || "0")
    const status = searchParams.get("status") || undefined
    // console.log('[DEBUG] Jobs query parameters', { userId, limit, offset })

    // Get user's jobs
    const jobs = await getUserJobs(userId, { limit, offset })
    // console.log('[DEBUG] Retrieved jobs count:', jobs.length)

    // console.log('[DEBUG] Returning jobs response')
    return NextResponse.json({
      jobs,
      pagination: {
        limit,
        offset,
        total: jobs.length, // In a real implementation, you would return the total count
      },
    })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

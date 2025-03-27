import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import fs from "fs"
import path from "path"

// This endpoint serves files from the local filesystem
// It will be replaced with S3/CloudFront in production

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  console.log('[DEBUG] Files GET request received', { path: params.path })
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the file path
    const filePath = params.path.join("/")
    const fullPath = path.join(process.cwd(), "uploads", filePath)
    console.log('[DEBUG] Accessing file', { filePath, fullPath })

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      console.log('[DEBUG] File not found on disk', { fullPath })
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Get file content
    const fileBuffer = fs.readFileSync(fullPath)

    // Determine content type based on file extension
    const ext = path.extname(fullPath).toLowerCase()
    let contentType = "application/octet-stream"
    console.log('[DEBUG] File metadata', { 
      ext, 
      size: fileBuffer.length, 
      filename: path.basename(fullPath)
    })

    switch (ext) {
      case ".mp4":
        contentType = "video/mp4"
        break
      case ".avi":
        contentType = "video/x-msvideo"
        break
      case ".wav":
        contentType = "audio/wav"
        break
      case ".mp3":
        contentType = "audio/mpeg"
        break
      case ".srt":
        contentType = "text/plain"
        break
    }

    console.log('[DEBUG] Serving file', { contentType, size: fileBuffer.length })
    // Return the file
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${path.basename(fullPath)}"`,
      },
    })
  } catch (error) {
    console.error("Error serving file:", error)
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { saveFile } from "@/lib/storage"
import { addConversionJob } from "@/lib/queue"
import { createConversionJob } from "@/lib/db"

// File size limit: 2GB
const MAX_FILE_SIZE = 2 * 1024 * 1024 * 1024

// Supported file types
const SUPPORTED_TYPES = [
  "video/mp4",
  "video/x-msvideo", // AVI
  "audio/wav",
  "audio/mpeg", // MP3
]

// Supported languages
const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "it", "pt", "ru", "ja", "ko", "zh", "ar", "hi", "bn", "ur"]

export async function POST(req: NextRequest) {
  console.log("[DEBUG] Convert POST request received")
  try {
    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get form data
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const language = (formData.get("language") as string) || "en"

    console.log(
      "[DEBUG] File upload details:",
      file
        ? {
            name: file.name,
            size: file.size,
            type: file.type,
            language,
          }
        : "No file provided",
    )

    // Validate file exists
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      console.log("[DEBUG] File size validation failed", { size: file.size, limit: MAX_FILE_SIZE })
      return NextResponse.json({ error: "File size exceeds the 2GB limit" }, { status: 400 })
    }

    // Validate file type
    if (!SUPPORTED_TYPES.includes(file.type)) {
      console.log("[DEBUG] File type validation failed", { type: file.type, supported: SUPPORTED_TYPES })
      return NextResponse.json({ error: "Unsupported file type. Please upload MP4, AVI, WAV, or MP3" }, { status: 400 })
    }

    // Validate language
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      console.log("[DEBUG] Language validation failed", { language, supported: SUPPORTED_LANGUAGES })
      return NextResponse.json({ error: "Unsupported language" }, { status: 400 })
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Save file to local storage
    console.log("[DEBUG] Saving file to storage", { fileName: file.name, userId })
    const fileUrl = await saveFile(buffer, file.name, userId)
    console.log("[DEBUG] File saved successfully", { fileUrl })

    // Create a conversion job
    console.log("[DEBUG] Creating conversion job")
    const job = await createConversionJob({
      userId,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      fileUrl,
      language,
    })

    // Add job to the queue
    console.log("[DEBUG] Adding job to processing queue", { jobId: job.id })
    await addConversionJob(job.id, fileUrl, userId, language)

    console.log("[DEBUG] Convert request completed successfully", { jobId: job.id })
    return NextResponse.json({
      jobId: job.id,
      status: "pending",
      pollingUrl: `/api/v1/convert/${job.id}`,
    })
  } catch (error) {
    console.error("Error processing file upload:", error)
    return NextResponse.json({ error: "Failed to process file upload" }, { status: 500 })
  }
}


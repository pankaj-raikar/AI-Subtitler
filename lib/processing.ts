import ffmpeg from "fluent-ffmpeg"
import { OpenAI } from "openai"
import { prisma } from "./prisma"
import { saveSRT } from "./storage"
import { createClient } from "@deepgram/sdk"
import { jsonToSrt } from "./json-2-srt-deegram"
import fs from "fs"
import path from "path"
import { promisify } from "util"
import { jsonToSrtOpenai, TranscriptJSON } from "./json-2-srt-openai"
import { auth } from "@clerk/nextjs/server"

// Initialize clients
console.log("[DEBUG] Initializing OpenAI client")
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

console.log("[DEBUG] Initializing Deepgram client")
const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "")

// File system promises
const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)
const unlinkAsync = promisify(fs.unlink)

/**
 * Transcribe audio using Deepgram API
 */
async function transcribeWithDeepgram(audioPath: string, language = "en"): Promise<string> {
  console.log("[DEBUG] Starting Deepgram transcription", { audioPath, language })
  try {
    console.log("[DEBUG] Reading audio file for Deepgram")
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(await readFileAsync(audioPath), {
      model: "whisper",
      language: language,
      smart_format: true,
    })

    if (error) {
      console.log("[DEBUG] Deepgram returned an error", { error })
      throw new Error(`Deepgram transcription error: ${error.message}`)
    }

    console.log("[DEBUG] Deepgram transcription successful, converting to SRT")
    // Convert JSON response to SRT format
    const srt = jsonToSrt(result)
    console.log("[DEBUG] SRT conversion completed", { srtLength: srt.length })
    return srt
  } catch (error) {
    console.error("Deepgram transcription failed:", error)
    throw error
  }
}

// Type for OpenAI response that includes text property
interface TranscriptionWithText {
  text: string
  [key: string]: any
}

/**
 * Transcribe audio using OpenAI Whisper API (fallback)
 */
async function transcribeWithOpenAI(audioPath: string, language = "en"): Promise<string> {
  console.log("[DEBUG] Starting OpenAI transcription", { audioPath, language })
  try {
    console.log("[DEBUG] Reading audio file for OpenAI")
    const audioData = await readFileAsync(audioPath)
    
    // Create a File object from the buffer
    const file = new File([audioData], "audio.wav", { type: "audio/wav" })
    
    console.log("[DEBUG] Sending audio to OpenAI for transcription", {
      fileSize: file.size,
      fileType: file.type,
      language,
    })
    const transcription = await openai.audio.transcriptions.create({
      file: file as any,
      model: "whisper-advanced", 
      response_format: "verbose_json",
      language: language,
    }) as TranscriptJSON

    console.log("[DEBUG] OpenAI transcription successful, converting to SRT")
    const result = jsonToSrtOpenai(transcription)
    console.log("[DEBUG] SRT conversion completed", { srtLength: result.length })

    return result
  } catch (error) {
    console.error("OpenAI transcription failed:", error)
    throw error
  }
}

/**
 * Process media file and generate subtitles
 */
export async function processMedia(jobId: string, fileUrl: string, userId: string, language = "en", useOpenAI = false) {
  console.log("[DEBUG] Starting media processing", { jobId, fileUrl, userId, language, useOpenAI })
  const tempDir = path.join(process.cwd(), "uploads", "temp")
  const audioPath = path.join(tempDir, `${jobId}.wav`)
  const cleanupFiles: string[] = [audioPath]
  let inputPath: string | undefined; // Declare inputPath here

  try {
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      console.log("[DEBUG] Creating temp directory")
      fs.mkdirSync(tempDir, { recursive: true })
    }

    // Update initial progress
    await prisma.$transaction(async (tx) => {
      await tx.conversionJob.update({
        where: { id: jobId },
        data: {
          status: "processing",
          progress: 10,
          updatedAt: new Date().toISOString(),
        },
      })
    })

    // Get the local file path
    const localFilePath = fileUrl.replace(/^\/api\/v1\/files\//, "")
    inputPath = path.join(process.cwd(), "uploads", localFilePath) // Assign value here
    console.log("[DEBUG] Resolved input file path", { fileUrl, localFilePath, inputPath })

    if (!fs.existsSync(inputPath)) {
      throw new Error(`Input file not found at path: ${inputPath}`)
    }

    // Update progress before audio extraction
    await prisma.$transaction(async (tx) => {
      await tx.conversionJob.update({
        where: { id: jobId },
        data: {
          progress: 30,
          updatedAt: new Date().toISOString(),
        },
      })
    })

    // Extract audio from input file
    console.log("[DEBUG] Starting FFmpeg audio extraction", {
      inputPath,
      outputPath: audioPath,
      fileExists: fs.existsSync(inputPath),
      fileSize: fs.existsSync(inputPath) ? fs.statSync(inputPath).size : 0,
    })

    await new Promise<void>((resolve, reject) => {
      const command = ffmpeg(inputPath)
        .outputOptions([
          "-vn", // No video
          "-acodec",
          "pcm_s16le", // Audio codec
          "-ar",
          "16000", // Sample rate
          "-ac",
          "1", // Mono audio
          "-y", // Overwrite output file if exists
        ])
        .save(audioPath)

      command
        .on("start", (commandLine) => {
          console.log("[DEBUG] FFmpeg started with command:", commandLine)
        })
        .on("progress", (progress) => {
          console.log("[DEBUG] FFmpeg progress:", {
            frames: progress.frames,
            currentFps: progress.currentFps,
            targetSize: progress.targetSize,
            timemark: progress.timemark,
            percent: progress.percent,
          })
        })
        .on("stderr", (stderrLine) => {
          console.log("[DEBUG] FFmpeg stderr:", stderrLine)
        })
        .on("end", () => {
          console.log("[DEBUG] FFmpeg audio extraction completed successfully")
          // Verify the output file
          if (fs.existsSync(audioPath)) {
            const stats = fs.statSync(audioPath)
            console.log("[DEBUG] Output audio file details:", {
              path: audioPath,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
            })
            resolve()
          } else {
            reject(new Error("FFmpeg completed but output file was not created"))
          }
        })
        .on("error", (err: { message: string }) => {
          console.error("[ERROR] FFmpeg error:", {
            message: err.message,
            inputPath,
            outputPath: audioPath,
          })
          reject(new Error(`FFmpeg error: ${err.message}`))
        })
    })

    // Verify audio file was created and is valid
    if (!fs.existsSync(audioPath)) {
      throw new Error("Audio file was not created successfully")
    }

    const audioStats = fs.statSync(audioPath)
    if (audioStats.size === 0) {
      throw new Error("Audio file was created but is empty")
    }

    console.log("[DEBUG] Audio extraction completed successfully", {
      audioPath,
      fileSize: audioStats.size,
      duration: audioStats.size / (16000 * 2), // Approximate duration in seconds
    })

    // Update progress before transcription
    await prisma.$transaction(async (tx) => {
      await tx.conversionJob.update({
        where: { id: jobId },
        data: {
          progress: 50,
          updatedAt: new Date().toISOString(),
        },
      })
    })

    // Transcribe the audio
    let srtContent: string
    try {
      if (language === "en") {
        console.log("[DEBUG] Using OpenAI for transcription (explicitly requested)")
        srtContent = await transcribeWithOpenAI(audioPath, language)
      } else {
        console.log("[DEBUG] Attempting Deepgram transcription first")
        try {
          srtContent = await transcribeWithDeepgram(audioPath, language)
        } catch (deepgramError) {
          console.warn("Deepgram transcription failed, falling back to OpenAI:", deepgramError)
          console.log("[DEBUG] Deepgram failed, falling back to OpenAI", {
            error: deepgramError instanceof Error ? deepgramError.message : String(deepgramError),
          })
          srtContent = await transcribeWithOpenAI(audioPath, language)
        }
      }
    } catch (error) {
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : String(error)}`)
    }

    // Update progress before saving SRT
    await prisma.$transaction(async (tx) => {
      await tx.conversionJob.update({
        where: { id: jobId },
        data: {
          progress: 90,
          updatedAt: new Date().toISOString(),
        },
      })
    })

    // Save the SRT file
    const srtPath = path.join(tempDir, `${jobId}.srt`)
    cleanupFiles.push(srtPath)
    await writeFileAsync(srtPath, srtContent)
    console.log("[DEBUG] SRT file saved successfully", { srtPath })

    // Upload SRT to storage
    const srtUrl = await saveSRT(srtContent, jobId, userId)
    console.log("[DEBUG] SRT file uploaded to storage", { srtUrl })

    // Update final progress and status
    await prisma.$transaction(async (tx) => {
      await tx.conversionJob.update({
        where: { id: jobId },
        data: {
          status: "completed",
          progress: 100,
          downloadUrl: srtUrl,
          updatedAt: new Date().toISOString(),
        },
      })
    })

    console.log("[DEBUG] Media processing completed successfully", { jobId })
  } catch (error) {
    console.error("[ERROR] Media processing failed:", error)
    throw error
  } finally {
    // Cleanup temporary files explicitly added to cleanupFiles array (e.g., audioPath, srtPath)
    console.log("[DEBUG] Starting cleanup of temporary processing files", { cleanupFiles });
    for (const file of cleanupFiles) {
      try {
        if (fs.existsSync(file)) {
          await unlinkAsync(file)
          console.log("[DEBUG] Successfully cleaned up temporary file:", file)
        } else {
          console.log("[DEBUG] Temporary file not found for cleanup:", file);
        }
      } catch (cleanupError) {
        console.warn("[WARN] Failed to cleanup temporary file:", file, { error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) });
      }
    }
    console.log("[DEBUG] Finished cleanup of temporary processing files.");

    // Cleanup the original uploaded file from local storage, as requested.
    // Note: Using local storage for uploads is not recommended for scalable production environments.
    if (inputPath && typeof inputPath === 'string') {
        console.log("[DEBUG] Attempting cleanup of original uploaded file from local storage", { inputPath });
        try {
            if (fs.existsSync(inputPath)) {
                await unlinkAsync(inputPath);
                console.log("[DEBUG] Successfully cleaned up original uploaded file:", inputPath);
            } else {
                console.log("[DEBUG] Original uploaded file not found for cleanup (already deleted?):", inputPath);
            }
        } catch (cleanupError) {
            console.warn("[WARN] Failed to cleanup original uploaded file:", inputPath, { error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) });
        }
    } else {
         console.warn("[WARN] Could not determine original input path for cleanup.");
    }
  }
}




/* 

// AWS S3 implementation (commented out for later)

async function uploadToStorage(jobId: string, srtContent: string) {

  // Implementation depends on your storage solution (S3, Firebase, etc.)

  // For example, with AWS S3:

  

  // const s3 = new AWS.S3();

  // await s3.putObject({

  //   Bucket: process.env.S3_BUCKET,

  //   Key: `subtitles/${jobId}.srt`,

  //   Body: srtContent,

  //   ContentType: 'text/plain'

  // }).promise();

  

  // return `https://${process.env.CLOUDFRONT_DOMAIN}/subtitles/${jobId}.srt`;

}

*/

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
import logger from "./logger" // Import the logger

// Initialize clients
logger.debug("Initializing OpenAI client")
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
})

logger.debug("Initializing Deepgram client")
const deepgram = createClient(process.env.DEEPGRAM_API_KEY || "")

// File system promises
const writeFileAsync = promisify(fs.writeFile)
const readFileAsync = promisify(fs.readFile)
const unlinkAsync = promisify(fs.unlink)

/**
 * Transcribe audio using Deepgram API
 */
async function transcribeWithDeepgram(audioPath: string, language = "en"): Promise<string> {
  logger.debug("Starting Deepgram transcription", { audioPath, language })
  try {
    logger.debug("Reading audio file for Deepgram", { audioPath })
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(await readFileAsync(audioPath), {
      model: "whisper",
      language: 'en', // Ensure this matches the function parameter if dynamic language is needed
      smart_format: true,
    })

    if (error) {
      logger.error("Deepgram returned an error during transcription", { audioPath, language, error: error.message, stack: error.stack })
      throw new Error(`Deepgram transcription error: ${error.message}`)
    }

    logger.debug("Deepgram transcription successful, converting to SRT", { audioPath })
    // Convert JSON response to SRT format
    const srt = jsonToSrt(result)
    logger.debug("SRT conversion from Deepgram result completed", { srtLength: srt.length })
    return srt
  } catch (error) {
    logger.error("Deepgram transcription failed", { audioPath, language, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
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
  logger.debug("Starting OpenAI transcription", { audioPath, language })
  try {
    logger.debug("Reading audio file for OpenAI", { audioPath })
    const audioData = await readFileAsync(audioPath)

    // Create a File object from the buffer
    const file = new File([audioData], "audio.wav", { type: "audio/wav" })

    logger.debug("Sending audio to OpenAI for transcription", {
      fileSize: file.size,
      fileType: file.type,
      language,
    })
    const transcription = await openai.audio.transcriptions.create({
      file: file as any, // Casting might be necessary depending on OpenAI SDK version
      model: "whisper-advanced", // Consider making model configurable
      response_format: "verbose_json",
      language: language,
    }) as TranscriptJSON // Assuming the response matches this interface

    logger.debug("OpenAI transcription successful, converting to SRT", { audioPath })
    const result = jsonToSrtOpenai(transcription)
    logger.debug("SRT conversion from OpenAI result completed", { srtLength: result.length })

    return result
  } catch (error) {
    logger.error("OpenAI transcription failed", { audioPath, language, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    throw error
  }
}

/**
 * Process media file and generate subtitles
 */
export async function processMedia(jobId: string, fileUrl: string, userId: string, language = "en", useOpenAI = false) {
  logger.info("Starting media processing", { jobId, fileUrl, userId, language, useOpenAI })
  const tempDir = path.join(process.cwd(), "uploads", "temp")
  const audioPath = path.join(tempDir, `${jobId}.wav`)
  const cleanupFiles: string[] = [audioPath]
  let inputPath: string | undefined; // Declare inputPath here

  try {
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      logger.debug("Creating temp directory", { tempDir })
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
    const localFilePath = fileUrl.replace(/^\/api\/v1\/files\//, "") // Consider a more robust way to map URL to path
    inputPath = path.join(process.cwd(), "uploads", localFilePath) // Assign value here
    logger.debug("Resolved input file path", { fileUrl, localFilePath, inputPath })

    if (!fs.existsSync(inputPath)) {
      logger.error("Input file not found", { jobId, inputPath })
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
    logger.debug("Starting FFmpeg audio extraction", {
      jobId,
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
          logger.debug("FFmpeg started", { jobId, commandLine })
        })
        .on("progress", (progress) => {
          // Log progress less frequently or only on significant changes if needed
          logger.debug("FFmpeg progress", {
            jobId,
            frames: progress.frames,
            currentFps: progress.currentFps,
            targetSize: progress.targetSize, // Note: targetSize might be in KB
            timemark: progress.timemark,
            percent: progress.percent,
          })
        })
        .on("stderr", (stderrLine) => {
          // Be cautious logging stderr, it can be verbose
          logger.debug("FFmpeg stderr", { jobId, stderrLine })
        })
        .on("end", () => {
          logger.debug("FFmpeg audio extraction completed successfully", { jobId })
          // Verify the output file
          if (fs.existsSync(audioPath)) {
            const stats = fs.statSync(audioPath)
            logger.debug("Output audio file details:", {
              jobId,
              path: audioPath,
              size: stats.size,
              created: stats.birthtime,
              modified: stats.mtime,
            })
            resolve()
          } else {
            logger.error("FFmpeg completed but output audio file was not created", { jobId, audioPath })
            reject(new Error("FFmpeg completed but output file was not created"))
          }
        })
        .on("error", (err: { message: string }) => {
          logger.error("FFmpeg error during audio extraction", {
            jobId,
            message: err.message,
            inputPath,
            outputPath: audioPath,
            // Consider adding stack trace if available: stack: err.stack
          })
          reject(new Error(`FFmpeg error: ${err.message}`))
        })
    })

    // Verify audio file was created and is valid
    if (!fs.existsSync(audioPath)) {
      logger.error("Audio file check failed: File does not exist after FFmpeg completion", { jobId, audioPath })
      throw new Error("Audio file was not created successfully")
    }

    const audioStats = fs.statSync(audioPath)
    if (audioStats.size === 0) {
      logger.error("Audio file check failed: File is empty after FFmpeg completion", { jobId, audioPath })
      throw new Error("Audio file was created but is empty")
    }

    logger.debug("Audio extraction verified successfully", {
      jobId,
      audioPath,
      fileSize: audioStats.size,
      approxDurationSec: audioStats.size / (16000 * 2), // Sample rate * bytes per sample (16-bit = 2 bytes)
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
      // Decision logic for transcription service
      if (useOpenAI || language === "en") { // Example: Use OpenAI if explicitly requested or if English
         logger.debug("Using OpenAI for transcription", { jobId, audioPath, language, reason: useOpenAI ? 'explicitly requested' : 'language is en' });
        srtContent = await transcribeWithOpenAI(audioPath, language)
      } else {
        logger.debug("Attempting Deepgram transcription first", { jobId, audioPath, language })
        try {
          srtContent = await transcribeWithDeepgram(audioPath, language)
        } catch (deepgramError) {
          logger.warn("Deepgram transcription failed, falling back to OpenAI", { jobId, language, error: deepgramError instanceof Error ? deepgramError.message : String(deepgramError) })
          srtContent = await transcribeWithOpenAI(audioPath, language)
        }
      }
    } catch (transcriptionError) {
       logger.error("Transcription failed after attempting selected services", { jobId, language, useOpenAI, error: transcriptionError instanceof Error ? transcriptionError.message : String(transcriptionError), stack: transcriptionError instanceof Error ? transcriptionError.stack : undefined });
      throw new Error(`Transcription failed: ${transcriptionError instanceof Error ? transcriptionError.message : String(transcriptionError)}`)
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

    // Save the SRT file locally (temporary step before upload)
    const srtPath = path.join(tempDir, `${jobId}.srt`)
    cleanupFiles.push(srtPath)
    await writeFileAsync(srtPath, srtContent)
    logger.debug("SRT file saved locally successfully", { jobId, srtPath })

    // Upload SRT to storage
    const srtUrl = await saveSRT(srtContent, jobId, userId)
    logger.debug("SRT file uploaded to storage", { jobId, srtUrl })

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

    logger.info("Media processing completed successfully", { jobId })
  } catch (error) {
    // Log the main processing error before updating the DB
    logger.error("Media processing failed", { jobId, error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined })
    // Update DB to reflect failure (ensure this happens even if cleanup fails)
    try {
       await prisma.conversionJob.update({
         where: { id: jobId },
         data: {
           status: "failed",
           progress: 0, // Or keep last known progress? Resetting might be clearer.
           error: error instanceof Error ? error.message : String(error),
           updatedAt: new Date().toISOString(),
         },
       });
       logger.info("Updated job status to failed in database", { jobId });
    } catch (dbUpdateError) {
        logger.error("Failed to update job status to failed in database after processing error", { jobId, dbUpdateError: dbUpdateError instanceof Error ? dbUpdateError.message : String(dbUpdateError) });
    }
    // Re-throw the original error after attempting to update DB
    throw error;
  } finally {
    // Cleanup temporary files explicitly added to cleanupFiles array (e.g., audioPath, srtPath)
    logger.debug("Starting cleanup of temporary processing files", { jobId, cleanupFiles });
    for (const file of cleanupFiles) {
      try {
        if (fs.existsSync(file)) {
          await unlinkAsync(file)
          logger.debug("Successfully cleaned up temporary file", { jobId, file })
        } else {
          logger.debug("Temporary file not found for cleanup (already deleted?)", { jobId, file });
        }
      } catch (cleanupError) {
        logger.warn("Failed to cleanup temporary file", { jobId, file, error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) });
      }
    }
    logger.debug("Finished cleanup of temporary processing files.", { jobId });

    // Cleanup the original uploaded file from local storage, as requested.
    // Note: Using local storage for uploads is not recommended for scalable production environments.
    if (inputPath && typeof inputPath === 'string') {
        logger.debug("Attempting cleanup of original uploaded file from local storage", { jobId, inputPath });
        try {
            if (fs.existsSync(inputPath)) {
                await unlinkAsync(inputPath);
                logger.debug("Successfully cleaned up original uploaded file", { jobId, inputPath });
            } else {
                logger.debug("Original uploaded file not found for cleanup (already deleted?)", { jobId, inputPath });
            }
        } catch (cleanupError) {
            logger.warn("Failed to cleanup original uploaded file", { jobId, inputPath, error: cleanupError instanceof Error ? cleanupError.message : String(cleanupError) });
        }
    } else {
         logger.warn("Could not determine original input path for cleanup.", { jobId });
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

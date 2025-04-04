import { createClient } from "@deepgram/sdk";
import fs from "fs";
import { jsonToSrt } from "./json-2-srt-deegram";
import logger from "./logger"; // Import the logger

const listen = async () => {
  logger.debug('Starting Deepgram API test function')
  logger.debug('Initializing Deepgram client')
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  logger.debug('Reading sample audio file')
  const audioFile = fs.readFileSync("japanese.mp3")
  logger.debug('Sample file loaded', { size: audioFile.length })

  logger.debug('Sending audio to Deepgram for transcription')
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioFile,
    {
      model: "whisper",
      language: "en",
      smart_format: true,
    }
  );

  if (error) {
    logger.error('Deepgram transcription error', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
  } else {
    logger.debug('Deepgram transcription successful, converting to SRT');
    const srtFormat = jsonToSrt(result);
    logger.debug('Writing SRT file to disk', { srtLength: srtFormat.length });
    fs.writeFileSync("output.srt", srtFormat);
    logger.debug('SRT file written successfully');
    logger.debug('Deepgram result:', { result }); // Log the result object as metadata
  }
};

logger.debug('Executing Deepgram test function');
listen().catch(error => {
  logger.error('Unhandled error in Deepgram test function', { error: error instanceof Error ? error.message : String(error), stack: error instanceof Error ? error.stack : undefined });
});

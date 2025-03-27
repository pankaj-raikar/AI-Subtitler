import { createClient } from "@deepgram/sdk";
import fs from "fs";
import { jsonToSrt } from "./json-2-srt-deegram";

const listen = async () => {
  console.log('[DEBUG] Starting Deepgram API test function')
  console.log('[DEBUG] Initializing Deepgram client')  
  const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

  console.log('[DEBUG] Reading sample audio file')
  const audioFile = fs.readFileSync("sample-0.mp3")
  console.log('[DEBUG] Sample file loaded', { size: audioFile.length })
  
  console.log('[DEBUG] Sending audio to Deepgram for transcription')
  const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
    audioFile,
    {
      model: "whisper",
      language: "en",
      smart_format: true,
    }
  );

  if (error) {
    console.error(error);
    console.log('[DEBUG] Deepgram transcription error', { 
      error: error instanceof Error ? error.message : String(error) 
    });
  } else {
    console.log('[DEBUG] Deepgram transcription successful, converting to SRT');
    const srtFormat = jsonToSrt(result);
    console.log('[DEBUG] Writing SRT file to disk', { srtLength: srtFormat.length });
    fs.writeFileSync("output.srt", srtFormat);
    console.log('[DEBUG] SRT file written successfully');
    console.dir(result, { depth: null });
  }
};

console.log('[DEBUG] Executing Deepgram test function');
listen().catch(error => {
  console.error('Error in Deepgram test function:', error);
  console.log('[DEBUG] Unhandled error in Deepgram test function', { 
    error: error instanceof Error ? error.message : String(error) 
  });
});

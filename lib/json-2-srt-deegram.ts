
import logger from "./logger"; // Import the logger

export function jsonToSrt(json: any): string {
  logger.debug('Starting JSON to SRT conversion')
  const formatTime = (seconds: number): string => {
    // This is a low-level utility, keep console.log for now or make it very verbose debug
    // logger.debug('Formatting timestamp', { seconds })
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000);

    // Handle overflow
    const adjustedSecs = secs + Math.floor(milliseconds / 1000);
    const adjustedMs = milliseconds % 1000;

    return (
      [
        String(hours).padStart(2, "0"),
        String(minutes).padStart(2, "0"),
        String(adjustedSecs).padStart(2, "0"),
      ].join(":") + `,${String(adjustedMs).padStart(3, "0")}`
    );
  };

  let srtContent = "";
  let index = 1;
  logger.debug('Beginning SRT content generation from JSON structure')

  try {
    logger.debug('Processing channels', {
      channelCount: json.results.channels.length
    })
    for (const channel of json.results.channels) {
      logger.debug('Processing alternatives', {
        alternativeCount: channel.alternatives.length
      })
      for (const alternative of channel.alternatives) {
        logger.debug('Processing paragraphs', {
          paragraphCount: alternative.paragraphs.paragraphs.length
        })
        for (const paragraph of alternative.paragraphs.paragraphs) {
          logger.debug('Processing sentences in paragraph', {
            sentenceCount: paragraph.sentences.length
          })
          for (const sentence of paragraph.sentences) {
            const startTime = formatTime(sentence.start);
            const endTime = formatTime(sentence.end);
            const text = sentence.text.replace(/\n+/g, " ").trim();

            logger.debug('Generated subtitle entry', {
              index,
              start: startTime,
              end: endTime,
              textLength: text.length 
            })

            srtContent += `${index}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            srtContent += `${text}\n\n`;
            index++;
          }
        }
      }
    }
  } catch (error) {
    logger.error('Error in JSON to SRT conversion', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
    throw new Error(
      `Error converting JSON to SRT: ${(error as Error).message}`
    );
  }

  logger.debug('JSON to SRT conversion completed', {
    totalEntries: index - 1,
    contentLength: srtContent.length
  })
  return srtContent.trim();
}

// Example usage:
// const srt = jsonToSrt(yourTranscriptData);
// console.log(srt);

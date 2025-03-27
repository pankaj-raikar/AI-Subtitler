

export function jsonToSrt(json: any): string {
  console.log('[DEBUG] Starting JSON to SRT conversion')
  const formatTime = (seconds: number): string => {
    console.log('[DEBUG] Formatting timestamp', { seconds })
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
  console.log('[DEBUG] Beginning SRT content generation from JSON structure')

  try {
    console.log('[DEBUG] Processing channels', { 
      channelCount: json.results.channels.length 
    })
    for (const channel of json.results.channels) {
      console.log('[DEBUG] Processing alternatives', { 
        alternativeCount: channel.alternatives.length 
      })
      for (const alternative of channel.alternatives) {
        console.log('[DEBUG] Processing paragraphs', { 
          paragraphCount: alternative.paragraphs.paragraphs.length 
        })
        for (const paragraph of alternative.paragraphs.paragraphs) {
          console.log('[DEBUG] Processing sentences in paragraph', { 
            sentenceCount: paragraph.sentences.length 
          })
          for (const sentence of paragraph.sentences) {
            const startTime = formatTime(sentence.start);
            const endTime = formatTime(sentence.end);
            const text = sentence.text.replace(/\n+/g, " ").trim();
            
            console.log('[DEBUG] Generated subtitle entry', { 
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
    console.log('[DEBUG] Error in JSON to SRT conversion', { 
      error: error instanceof Error ? error.message : String(error) 
    })
    throw new Error(
      `Error converting JSON to SRT: ${(error as Error).message}`
    );
  }

  console.log('[DEBUG] JSON to SRT conversion completed', { 
    totalEntries: index - 1, 
    contentLength: srtContent.length 
  })
  return srtContent.trim();
}

// Example usage:
// const srt = jsonToSrt(yourTranscriptData);
// console.log(srt);

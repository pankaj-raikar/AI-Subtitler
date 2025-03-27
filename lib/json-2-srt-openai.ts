interface Segment {
  end: number;
  start: number;
  text: string;
}

export interface TranscriptJSON {
  language: string;
  segments: Segment[];
  text: string;
}

export function jsonToSrtOpenai(json: TranscriptJSON): string {
  const formatTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const milliseconds = Math.round((seconds - Math.floor(seconds)) * 1000);

      return [
          String(hours).padStart(2, '0'),
          String(minutes).padStart(2, '0'),
          String(secs).padStart(2, '0')
      ].join(':') + `,${String(milliseconds).padStart(3, '0')}`;
  };

  let srtContent = '';
  let index = 1;

  for (const segment of json.segments) {
      const startTime = formatTime(segment.start);
      const endTime = formatTime(segment.end);
      const text = segment.text.trim().replace(/\n/g, ' ');

      srtContent += `${index}\n`;
      srtContent += `${startTime} --> ${endTime}\n`;
      srtContent += `${text}\n\n`;
      index++;
  }

  return srtContent.trim();
}
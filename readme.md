# AI-Subtitler

AI-Subtitler is a powerful web application that automatically generates accurate subtitles for videos using advanced AI technology. It supports multiple languages and provides a user-friendly interface for video subtitle generation.

## Features

- 🎥 Automatic video subtitle generation
- 🌍 Multi-language support
- 🤖 Powered by OpenAI and Deepgram AI
- 📝 SRT format output
- 🔒 Secure user authentication
- 📊 User dashboard for managing transcriptions
- ⚡ Fast and efficient processing
- 🎯 High accuracy transcription
- 🔄 Automatic fallback between AI services
- 📈 Real-time progress tracking
- 🎬 Support for various video formats
- 🔍 Smart language detection

## Tech Stack

- **Frontend**: Next.js 14, React, TailwindCSS
- **Backend**: Next.js API Routes
- **Authentication**: Clerk
- **Database**: Prisma
- **AI Services**: OpenAI, Deepgram
- **File Processing**: FFmpeg
- **Storage**: Cloudflare R2
- **Queue System**: Custom implementation
- **File Formats**: Supports MP4, MOV, AVI, MKV, and more

## Architecture

### Core Components

1. **Video Processing Pipeline**
   - FFmpeg for audio extraction
   - Automatic format conversion
   - Quality optimization
   - Progress tracking

2. **AI Transcription Services**
   - OpenAI Whisper (primary for English)
   - Deepgram (primary for other languages)
   - Automatic fallback mechanism
   - Smart language detection

3. **Storage System**
   - Local file system for temporary storage
   - Cloudflare R2 for permanent storage
   - Secure file handling
   - Automatic cleanup

4. **User Management**
   - Secure authentication via Clerk
   - User-specific storage
   - Job history tracking
   - Progress monitoring

### Processing Flow

1. Video Upload
   - File validation
   - Format checking
   - Size verification

2. Audio Extraction
   - FFmpeg processing
   - Audio optimization
   - Quality preservation

3. Transcription
   - Language detection
   - AI service selection
   - Fallback handling
   - Progress tracking

4. SRT Generation
   - Format conversion
   - Timing synchronization
   - Quality checks

5. Storage & Delivery
   - Cloud storage
   - Download preparation
   - Cleanup

## Getting Started

### Prerequisites

- Node.js 18+ 
- FFmpeg installed on your system
- OpenAI API key
- Deepgram API key
- Clerk account for authentication
- Cloudflare R2 account (for production)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/pankaj-raikar/AI-Subtitler.git
cd AI-Subtitler
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file in the root directory with the following variables:
```env
OPENAI_API_KEY=your_openai_api_key
DEEPGRAM_API_KEY=your_deepgram_api_key
CLERK_SECRET_KEY=your_clerk_secret_key
DATABASE_URL=your_database_url
CLOUDFLARE_ACCOUNT_ID=your_cloudflare_account_id
CLOUDFLARE_R2_ACCESS_KEY_ID=your_r2_access_key
CLOUDFLARE_R2_SECRET_ACCESS_KEY=your_r2_secret_key
CLOUDFLARE_R2_BUCKET_NAME=your_bucket_name
CLOUDFLARE_R2_PUBLIC_URL=your_public_url
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Sign up for an account or sign in
2. Navigate to the dashboard
3. Upload your video file
4. Select your preferred language
5. Choose between OpenAI or Deepgram for transcription
6. Wait for the processing to complete
7. Download your generated SRT file

## API Integration

The application supports two AI services for transcription:

- **OpenAI**: High-quality transcription with advanced language understanding
  - Primary choice for English content
  - Advanced language model
  - Higher accuracy but slower processing

- **Deepgram**: Fast and efficient transcription with good accuracy
  - Primary choice for non-English content
  - Optimized for speed
  - Good accuracy with faster processing

## Performance Optimization

- Automatic format conversion for optimal processing
- Smart caching system
- Efficient file handling
- Background job processing
- Automatic cleanup of temporary files

## Security Features

- Secure file uploads
- User authentication
- File access control
- API key protection
- Secure storage handling

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for providing the transcription API
- Deepgram for their speech-to-text service
- Clerk for authentication
- Next.js team for the amazing framework
- FFmpeg for video processing capabilities
- Cloudflare for R2 storage

## Support

If you encounter any issues or have questions, please open an issue in the GitHub repository.

## Roadmap

- [ ] Add support for more video formats
- [ ] Implement batch processing
- [ ] Add subtitle editing interface
- [ ] Support for custom vocabulary
- [ ] Real-time transcription
- [ ] API rate limiting
- [ ] Advanced error handling
- [ ] Performance analytics

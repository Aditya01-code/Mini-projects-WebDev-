# TranscriptHub

TranscriptHub is a web application that allows users to easily view, search, and copy transcripts from YouTube videos. It features a clean, responsive interface with support for both light and dark themes.

## Features

- Extract transcripts from any YouTube video with captions
- Clean, responsive user interface with light/dark theme toggle
- Interactive transcript timestamps that jump to specific video points
- Copy transcript to clipboard with one click
- Recently viewed videos history
- Animated visual elements including typing animation and animated lines

## Prerequisites

Before running the application, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v14.0.0 or higher)
- npm (usually comes with Node.js)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/transcript-hub.git
cd transcript-hub
```

### 2. Install dependencies

```bash
npm install
```

This will install all required dependencies including:
- express
- cors
- axios
- subtitle

## Project Structure

```
transcript-hub/
├── public/                # Frontend static files
│   ├── frontend-css.css   # CSS styles
│   ├── frontend-js.js     # Frontend JavaScript
│   └── index.html         # Main HTML file
├── backend-server.js      # Backend Express server
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## Configuration

If you want to use the YouTube API for enhanced video information (optional):

1. Get a YouTube Data API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Set it as an environment variable:

```bash
# On Linux/Mac
export YOUTUBE_API_KEY=your_api_key_here

# On Windows Command Prompt
set YOUTUBE_API_KEY=your_api_key_here

# On Windows PowerShell
$env:YOUTUBE_API_KEY="your_api_key_here"
```

Note: The application can still work without a YouTube API key, but some features might be limited.

## Running the Application

### Start the server

```bash
node backend-server.js
```

The server will start on port 5000 by default (or any port specified in the PORT environment variable).

### Access the application

Open your browser and navigate to:

```
http://localhost:5000
```

## Usage

1. Enter a YouTube video URL or ID in the input field
2. Click "Get Transcript" or press Enter
3. The video will be embedded and the transcript will be displayed below
4. Click on any timestamp in the transcript to jump to that point in the video
5. Use the "Copy Transcript" button to copy the entire transcript to your clipboard
6. Toggle between light and dark themes using the moon/sun icon in the header

## API Endpoints

The backend provides the following API endpoints:

- `GET /api/transcript/:videoId` - Fetches and returns the transcript for a video
- `GET /api/video-info/:videoId` - Returns information about a video (requires YouTube API key)

## Known Limitations

- Only works with videos that have captions/subtitles enabled
- YouTube's automatic captions may contain inaccuracies
- Some videos may have restricted access to captions

## Troubleshooting

If you encounter issues:

1. **No transcript displayed**: Make sure the video has captions available. Not all YouTube videos have captions.
2. **Server errors**: Check the console for detailed error messages. Make sure you have internet connectivity.
3. **CORS issues**: If testing locally with separate frontend/backend servers, ensure CORS is properly configured.

## License

[MIT](LICENSE)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
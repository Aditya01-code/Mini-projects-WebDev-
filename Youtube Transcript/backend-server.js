const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { parseSync } = require('subtitle');
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend requests
app.use(cors());

// Serve static files from public directory
app.use(express.static('public'));

// YouTube transcript endpoint
app.get('/api/transcript/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        if (!videoId) {
            return res.status(400).json({ error: 'Video ID is required' });
        }
        
        // Fetch video info to get caption track URL
        const videoInfoResponse = await axios.get(`https://www.youtube.com/watch?v=${videoId}`);
        const videoInfoHtml = videoInfoResponse.data;
        
        // Extract caption track URL from video info
        // This is a simplified approach and might need adjustments based on YouTube's structure
        const captionTrackRegex = /"captionTracks":\s*\[\s*\{\s*"baseUrl":\s*"([^"]+)"/;
        const match = videoInfoHtml.match(captionTrackRegex);
        
        if (!match || !match[1]) {
            return res.status(404).json({ error: 'No captions found for this video' });
        }
        
        const captionUrl = match[1].replace(/\\u0026/g, '&');
        
        // Fetch the caption file
        const captionResponse = await axios.get(captionUrl);
        const captionData = captionResponse.data;
        
        // Parse the caption data
        // YouTube uses a specific XML format for captions, this is a simplified version
        const lines = captionData.split('<text');
        const transcript = [];
        
        for (let i = 1; i < lines.length; i++) {
            const startMatch = lines[i].match(/start="([^"]+)"/);
            const durMatch = lines[i].match(/dur="([^"]+)"/);
            const textEnd = lines[i].indexOf('</text>');
            const textStart = lines[i].indexOf('>') + 1;
            
            if (startMatch && textEnd > textStart) {
                const start = parseFloat(startMatch[1]);
                const text = lines[i].substring(textStart, textEnd)
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'");
                
                transcript.push({
                    start,
                    text
                });
            }
        }
        
        res.json({ transcript });
    } catch (error) {
        console.error('Error fetching transcript:', error);
        res.status(500).json({ 
            error: 'Failed to fetch transcript',
            message: error.message 
        });
    }
});

// Fallback for direct access to video info
app.get('/api/video-info/:videoId', async (req, res) => {
    try {
        const { videoId } = req.params;
        
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/videos`, {
            params: {
                id: videoId,
                part: 'snippet',
                key: process.env.YOUTUBE_API_KEY // You'll need to set this in your environment
            }
        });
        
        if (response.data.items && response.data.items.length > 0) {
            res.json({ videoInfo: response.data.items[0].snippet });
        } else {
            res.status(404).json({ error: 'Video not found' });
        }
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).json({ error: 'Failed to fetch video info' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Fallback route for any other requests
app.get('*', (req, res) => {
    res.sendFile('index.html', { root: 'public' });
});

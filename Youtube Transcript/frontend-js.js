document.addEventListener('DOMContentLoaded', () => {
    const videoInput = document.getElementById('videoInput');
    const fetchBtn = document.getElementById('fetchBtn');
    const previewDiv = document.getElementById('preview');
    const transcriptDiv = document.getElementById('transcript');
    const themeToggle = document.getElementById('themeToggle');
    const recentVideosDiv = document.getElementById('recentVideos');
    
    // Backend API URL - change this if your server runs on a different port or host
    const API_BASE_URL = 'http://localhost:5000/api';
    
    // Initialize theme from localStorage or default to light
    initializeTheme();
    
    // Load recent videos
    loadRecentVideos();
    
    // Set initial typing animation in transcript div
    setDefaultTranscriptState();
    
    // Event listeners
    fetchBtn.addEventListener('click', handleFetchTranscript);
    videoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleFetchTranscript();
        }
    });
    
    themeToggle.addEventListener('click', toggleTheme);
    
    // New function to set default transcript state with typing animation
    function setDefaultTranscriptState() {
        transcriptDiv.innerHTML = `
            <div class="transcript-header">
                <h2 class="transcript-title">Transcript</h2>
            </div>
            <div class="typing-animation">Enter a YouTube URL to view transcript...</div>
        `;
    }
    
    function initializeTheme() {
        const currentTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', currentTheme);
        updateThemeIcon(currentTheme);
    }
    
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }
    
    function updateThemeIcon(theme) {
        const icon = themeToggle.querySelector('i');
        if (theme === 'dark') {
            icon.className = 'fas fa-sun';
        } else {
            icon.className = 'fas fa-moon';
        }
    }
    
    function handleFetchTranscript() {
        const videoId = extractVideoId(videoInput.value.trim());
        
        if (!videoId) {
            transcriptDiv.innerHTML = '<p class="error">Please enter a valid YouTube URL or video ID.</p>';
            previewDiv.innerHTML = '';
            return;
        }
        
        // Update UI
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        previewDiv.innerHTML = `
            <h2>Video Preview</h2>
            <iframe 
                width="560" 
                height="315" 
                src="https://www.youtube.com/embed/${videoId}" 
                frameborder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowfullscreen>
            </iframe>
        `;
        
        transcriptDiv.innerHTML = '<p class="loading">Loading transcript...</p>';
        
        // Fetch transcript from our backend API
        fetch(`${API_BASE_URL}/transcript/${videoId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data && data.transcript && data.transcript.length > 0) {
                    displayTranscript(data.transcript);
                    saveToRecentVideos(videoId);
                } else {
                    transcriptDiv.innerHTML = '<p class="error">No transcript available for this video.</p>';
                }
            })
            .catch(error => {
                console.error('Error fetching transcript:', error);
                transcriptDiv.innerHTML = `
                    <p class="error">Error fetching transcript: ${error.message}</p>
                    <p>This could be because:</p>
                    <ul>
                        <li>The video doesn't have closed captions</li>
                        <li>The video ID is incorrect</li>
                        <li>The backend server is not running</li>
                        <li>There was a network error</li>
                    </ul>
                `;
            })
            .finally(() => {
                fetchBtn.disabled = false;
                fetchBtn.innerHTML = 'Get Transcript';
            });
    }
    
    function displayTranscript(transcriptData) {
        if (!transcriptData || transcriptData.length === 0) {
            transcriptDiv.innerHTML = '<p class="error">No transcript available for this video.</p>';
            return;
        }
        
        // Store the plain text version for copying
        let plainTextTranscript = '';
        
        // Add the transcript header with copy button and proper heading
        let transcriptHTML = `
            <div class="transcript-header">
                <h2 class="transcript-title">Transcript</h2>
                <button id="copyBtn" class="copy-btn">
                    <i class="fas fa-copy"></i> Copy Transcript
                </button>
            </div>
            <div class="typing-animation">Transcript shows here</div>
            <div class="transcript-content" style="display: none;">
        `;
        
        transcriptData.forEach(item => {
            const start = item.start || 0;
            const minutes = Math.floor(start / 60);
            const seconds = Math.floor(start % 60);
            const timestamp = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // Add to HTML
            transcriptHTML += `
                <div class="transcript-line">
                    <span class="timestamp" data-time="${start}">[${timestamp}]</span>
                    <span class="text">${item.text}</span>
                </div>
            `;
            
            // Add to plain text version
            plainTextTranscript += `[${timestamp}] ${item.text}\n`;
        });
        
        transcriptHTML += '</div>';
        
        transcriptDiv.innerHTML = transcriptHTML;
        
        // Add event listener to the copy button
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', () => {
                copyToClipboard(plainTextTranscript);
            });
        }
        
        // Typing animation effect - show real content after animation completes
        setTimeout(() => {
            const typingAnimation = document.querySelector('.typing-animation');
            const transcriptContent = document.querySelector('.transcript-content');
            
            if (typingAnimation && transcriptContent) {
                typingAnimation.style.display = 'none';
                transcriptContent.style.display = 'block';
                
                // Add click events to timestamps for jumping to video time
                const timestamps = document.querySelectorAll('.timestamp');
                timestamps.forEach(timestamp => {
                    timestamp.style.cursor = 'pointer';
                    timestamp.title = 'Click to jump to this point in the video';
                    timestamp.addEventListener('click', () => {
                        const time = timestamp.getAttribute('data-time');
                        const iframe = document.querySelector('iframe');
                        if (iframe && time) {
                            // Update the iframe src to jump to the specific time
                            const currentSrc = iframe.src;
                            const baseUrl = currentSrc.split('?')[0];
                            iframe.src = `${baseUrl}?start=${time}&autoplay=1`;
                        }
                    });
                });
            }
        }, 3500); // Time should match the CSS animation duration
    }
    
    function copyToClipboard(text) {
        if (navigator.clipboard && window.isSecureContext) {
            // Modern approach with Clipboard API
            navigator.clipboard.writeText(text)
                .then(() => showCopyFeedback(true))
                .catch(err => {
                    console.error('Failed to copy: ', err);
                    showCopyFeedback(false);
                });
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.setAttribute('readonly', '');
            textarea.style.position = 'absolute';
            textarea.style.left = '-9999px';
            document.body.appendChild(textarea);
            
            try {
                textarea.select();
                document.execCommand('copy');
                showCopyFeedback(true);
            } catch (err) {
                console.error('Failed to copy text: ', err);
                showCopyFeedback(false);
            }
            
            document.body.removeChild(textarea);
        }
    }
    
    function showCopyFeedback(success) {
        const copyBtn = document.getElementById('copyBtn');
        const originalText = copyBtn.innerHTML;
        
        if (success) {
            copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
            copyBtn.classList.add('copied');
        } else {
            copyBtn.innerHTML = '<i class="fas fa-times"></i> Copy Failed';
            copyBtn.classList.add('copy-error');
        }
        
        // Reset button text after a short delay
        setTimeout(() => {
            copyBtn.innerHTML = originalText;
            copyBtn.classList.remove('copied', 'copy-error');
        }, 2000);
    }
    
    function saveToRecentVideos(videoId) {
        // Get existing videos or initialize empty array
        let recentVideos = JSON.parse(localStorage.getItem('recentVideos')) || [];
        
        // Check if this video is already in the list
        const existingIndex = recentVideos.findIndex(video => video.id === videoId);
        if (existingIndex !== -1) {
            // Move to the front of the list
            const existingVideo = recentVideos.splice(existingIndex, 1)[0];
            recentVideos.unshift(existingVideo);
        } else {
            // Add new video to the front
            recentVideos.unshift({
                id: videoId,
                timestamp: new Date().getTime()
            });
        }
        
        // Keep only the most recent 10 videos
        recentVideos = recentVideos.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('recentVideos', JSON.stringify(recentVideos));
        
        // Update the UI
        loadRecentVideos();
    }
    
    function loadRecentVideos() {
        const recentVideos = JSON.parse(localStorage.getItem('recentVideos')) || [];
        
        if (recentVideos.length === 0) {
            recentVideosDiv.classList.remove('has-items');
            return;
        }
        
        // Show the section
        recentVideosDiv.classList.add('has-items');
        
        // Generate HTML
        let html = `
            <h3>Recent Videos</h3>
            <div class="recent-list">
        `;
        
        recentVideos.forEach(video => {
            html += `
                <div class="recent-item" data-video-id="${video.id}">
                    <img src="https://img.youtube.com/vi/${video.id}/mqdefault.jpg" class="recent-thumbnail" alt="Video thumbnail">
                    <div class="recent-info">
                        <div class="recent-title">YouTube Video</div>
                        <div class="recent-id">${video.id}</div>
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        recentVideosDiv.innerHTML = html;
        
        // Add click events
        const recentItems = document.querySelectorAll('.recent-item');
        recentItems.forEach(item => {
            item.addEventListener('click', () => {
                const videoId = item.getAttribute('data-video-id');
                videoInput.value = videoId;
                handleFetchTranscript();
                
                // Scroll to top
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        });
    }
    
    function extractVideoId(input) {
        // Handle full youtube URLs
        const urlRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
        const urlMatch = input.match(urlRegex);
        
        if (urlMatch && urlMatch[1]) {
            return urlMatch[1];
        }
        
        // Check if the input is just a video ID (11 characters)
        if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
            return input;
        }
        
        return null;
    }
});
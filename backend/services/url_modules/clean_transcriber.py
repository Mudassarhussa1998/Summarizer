import os
import sys
import re
from typing import Optional, List

try:
    import yt_dlp
    import requests
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Please install with: pip install yt-dlp requests")
    sys.exit(1)

class CleanYouTubeTranscriber:
    """Handles YouTube video transcript extraction and cleaning."""
    
    def __init__(self):
        """Initialize the transcriber."""
        self.ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en', 'en-US', 'en-GB']
        }
        
    def get_video_info(self, url: str) -> dict:
        """Get video title and duration.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dict containing video information
        """
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                return {
                    'title': info.get('title', 'Unknown Title'),
                    'duration': info.get('duration', 0),
                    'uploader': info.get('uploader', ''),
                    'description': info.get('description', '')[:500] + '...' if info.get('description', '') else ''
                }
        except Exception as e:
            print(f"Error getting video info: {e}")
            return {'title': 'Unknown Title', 'duration': 0, 'uploader': '', 'description': ''}
    
    def extract_clean_captions(self, url: str) -> Optional[str]:
        """Extract and clean captions from YouTube.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Cleaned transcript text or None if extraction fails
        """
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                # Try manual captions first (higher quality)
                subtitles = info.get('subtitles', {})
                if subtitles:
                    for lang in ['en', 'en-US', 'en-GB']:
                        if lang in subtitles:
                            caption_url = subtitles[lang][0]['url']
                            response = requests.get(caption_url, timeout=30)
                            if response.status_code == 200:
                                return self._extract_clean_text(response.text)
                
                # Try automatic captions as fallback
                auto_captions = info.get('automatic_captions', {})
                if auto_captions:
                    for lang in ['en', 'en-US', 'en-GB']:
                        if lang in auto_captions:
                            caption_url = auto_captions[lang][0]['url']
                            response = requests.get(caption_url, timeout=30)
                            if response.status_code == 200:
                                return self._extract_clean_text(response.text)
                
                return None
                
        except Exception as e:
            print(f"Error extracting captions: {e}")
            return None
    
    def _extract_clean_text(self, raw_captions: str) -> str:
        """Extract and clean text from raw caption data.
        
        Args:
            raw_captions: Raw caption data (XML, VTT, or JSON format)
            
        Returns:
            Cleaned transcript text
        """
        try:
            # Handle JSON format (YouTube's newer format)
            if raw_captions.strip().startswith('{') or 'events' in raw_captions:
                import json
                try:
                    # Parse JSON data
                    if isinstance(raw_captions, str):
                        caption_data = json.loads(raw_captions)
                    else:
                        caption_data = raw_captions
                    
                    # Extract text from events
                    text_parts = []
                    events = caption_data.get('events', [])
                    
                    for event in events:
                        segs = event.get('segs', [])
                        for seg in segs:
                            if 'utf8' in seg:
                                text_parts.append(seg['utf8'])
                    
                    text = ' '.join(text_parts)
                    
                except (json.JSONDecodeError, KeyError, TypeError) as e:
                    print(f"Error parsing JSON captions: {e}")
                    # Fallback to regex extraction for malformed JSON
                    text_pattern = r'"utf8":\s*"([^"]*)"'
                    matches = re.findall(text_pattern, raw_captions)
                    text = ' '.join(matches)
            
            # Handle XML format (YouTube's default)
            elif '<text' in raw_captions:
                # Extract text content from XML tags
                text_pattern = r'<text[^>]*>([^<]+)</text>'
                matches = re.findall(text_pattern, raw_captions)
                text = ' '.join(matches)
            
            # Handle VTT format
            elif 'WEBVTT' in raw_captions:
                lines = raw_captions.split('\n')
                text_lines = []
                for line in lines:
                    # Skip timestamp lines and empty lines
                    if '-->' not in line and line.strip() and not line.startswith('WEBVTT'):
                        # Remove VTT formatting tags
                        clean_line = re.sub(r'<[^>]+>', '', line)
                        if clean_line.strip():
                            text_lines.append(clean_line.strip())
                text = ' '.join(text_lines)
            
            else:
                # Fallback: treat as plain text
                text = raw_captions
            
            return self._clean_extracted_text(text)
            
        except Exception as e:
            print(f"Error cleaning text: {e}")
            return raw_captions
    
    def _clean_extracted_text(self, text: str) -> str:
        """Clean and format extracted text.
        
        Args:
            text: Raw extracted text
            
        Returns:
            Cleaned and formatted text
        """
        if not text:
            return ""
        
        # Remove HTML entities
        text = text.replace('&amp;', '&')
        text = text.replace('&lt;', '<')
        text = text.replace('&gt;', '>')
        text = text.replace('&quot;', '"')
        text = text.replace('&#39;', "'")
        
        # Remove extra whitespace and normalize
        text = ' '.join(text.split())
        
        # Remove repetitive phrases common in auto-generated captions
        repetitive_patterns = [
            r'\b(music|Music|MUSIC)\b',
            r'\b(applause|Applause|APPLAUSE)\b',
            r'\[.*?\]',  # Remove bracketed content
            r'\(.*?\)',  # Remove parenthetical content that's likely sound effects
        ]
        
        for pattern in repetitive_patterns:
            text = re.sub(pattern, '', text)
        
        # Clean up multiple spaces
        text = re.sub(r'\s+', ' ', text)
        
        # Split into sentences and rejoin for better formatting
        sentences = self._split_into_sentences(text)
        
        return ' '.join(sentences).strip()
    
    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences.
        
        Args:
            text: Input text
            
        Returns:
            List of sentences
        """
        # Simple sentence splitting
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def transcribe(self, url: str) -> str:
        """Main transcription method.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Transcribed and cleaned text
        """
        if not self._is_valid_youtube_url(url):
            return "Error: Invalid YouTube URL"
        
        transcript = self.extract_clean_captions(url)
        
        if transcript:
            return transcript
        else:
            return "Error: Could not extract transcript from this video. The video may not have captions available."
    
    def _is_valid_youtube_url(self, url: str) -> bool:
        """Check if URL is a valid YouTube URL.
        
        Args:
            url: URL to validate
            
        Returns:
            True if valid YouTube URL, False otherwise
        """
        youtube_patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtu\.be/([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtube\.com/embed/([\w-]+)'
        ]
        
        return any(re.match(pattern, url) for pattern in youtube_patterns)
    
    def get_transcript_with_metadata(self, url: str) -> dict:
        """Get transcript along with video metadata.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dict containing transcript and metadata
        """
        video_info = self.get_video_info(url)
        transcript = self.transcribe(url)
        
        return {
            'video_info': video_info,
            'transcript': transcript,
            'word_count': len(transcript.split()) if transcript and not transcript.startswith('Error:') else 0,
            'character_count': len(transcript) if transcript and not transcript.startswith('Error:') else 0
        }
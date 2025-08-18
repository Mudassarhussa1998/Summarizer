import re
from typing import Dict, Optional, Any
from datetime import datetime

try:
    import yt_dlp
except ImportError as e:
    print(f"Missing required dependency: {e}")
    print("Please install with: pip install yt-dlp")
    raise

class VideoInfoExtractor:
    """Handles YouTube video information extraction."""
    
    def __init__(self):
        """Initialize the video info extractor."""
        self.ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False
        }
    
    def get_video_info(self, url: str) -> Dict[str, Any]:
        """Get comprehensive video information from YouTube URL.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dict containing video information (title, duration, description, etc.)
        """
        if not self.is_valid_youtube_url(url):
            return {
                'title': 'Invalid URL',
                'duration': 0,
                'duration_formatted': '00:00:00',
                'description': '',
                'uploader': '',
                'upload_date': '',
                'view_count': 0,
                'like_count': 0,
                'thumbnail': '',
                'tags': [],
                'category': '',
                'error': 'Invalid YouTube URL'
            }
        
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                # Format duration
                duration_seconds = info.get('duration', 0)
                duration_formatted = self._format_duration(duration_seconds)
                
                # Format upload date
                upload_date = info.get('upload_date', '')
                formatted_upload_date = self._format_upload_date(upload_date)
                
                # Get thumbnail (best quality available)
                thumbnails = info.get('thumbnails', [])
                thumbnail_url = ''
                if thumbnails:
                    # Get the highest quality thumbnail
                    thumbnail_url = thumbnails[-1].get('url', '')
                
                return {
                    'title': info.get('title', 'Unknown Title'),
                    'duration': duration_seconds,
                    'duration_formatted': duration_formatted,
                    'description': self._truncate_description(info.get('description', '')),
                    'uploader': info.get('uploader', ''),
                    'upload_date': formatted_upload_date,
                    'view_count': info.get('view_count', 0),
                    'like_count': info.get('like_count', 0),
                    'thumbnail': thumbnail_url,
                    'tags': info.get('tags', [])[:10],  # Limit to first 10 tags
                    'category': info.get('category', ''),
                    'video_id': self._extract_video_id(url),
                    'channel_id': info.get('channel_id', ''),
                    'channel_url': info.get('channel_url', ''),
                    'webpage_url': info.get('webpage_url', url)
                }
                
        except Exception as e:
            return {
                'title': 'Error retrieving video info',
                'duration': 0,
                'duration_formatted': '00:00:00',
                'description': '',
                'uploader': '',
                'upload_date': '',
                'view_count': 0,
                'like_count': 0,
                'thumbnail': '',
                'tags': [],
                'category': '',
                'error': f'Failed to extract video information: {str(e)}'
            }
    
    def _format_duration(self, seconds: int) -> str:
        """Format duration from seconds to HH:MM:SS.
        
        Args:
            seconds: Duration in seconds
            
        Returns:
            Formatted duration string
        """
        if not seconds:
            return '00:00:00'
        
        hours = seconds // 3600
        minutes = (seconds % 3600) // 60
        seconds = seconds % 60
        
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"
    
    def _format_upload_date(self, upload_date: str) -> str:
        """Format upload date from YYYYMMDD to readable format.
        
        Args:
            upload_date: Date in YYYYMMDD format
            
        Returns:
            Formatted date string
        """
        if not upload_date or len(upload_date) != 8:
            return ''
        
        try:
            year = upload_date[:4]
            month = upload_date[4:6]
            day = upload_date[6:8]
            
            date_obj = datetime.strptime(f"{year}-{month}-{day}", "%Y-%m-%d")
            return date_obj.strftime("%B %d, %Y")
        except ValueError:
            return upload_date
    
    def _truncate_description(self, description: str, max_length: int = 500) -> str:
        """Truncate description to specified length.
        
        Args:
            description: Full description text
            max_length: Maximum length for truncated description
            
        Returns:
            Truncated description
        """
        if not description:
            return ''
        
        if len(description) <= max_length:
            return description
        
        return description[:max_length].rsplit(' ', 1)[0] + '...'
    
    def _extract_video_id(self, url: str) -> str:
        """Extract video ID from YouTube URL.
        
        Args:
            url: YouTube video URL
            
        Returns:
            Video ID string
        """
        patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtu\.be/([\w-]+)',
            r'(?:https?://)?(?:www\.)?youtube\.com/embed/([\w-]+)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                return match.group(1)
        
        return ''
    
    def is_valid_youtube_url(self, url: str) -> bool:
        """Check if URL is a valid YouTube URL.
        
        Args:
            url: URL to validate
            
        Returns:
            True if valid YouTube URL, False otherwise
        """
        if not url:
            return False
        
        youtube_patterns = [
            r'(?:https?://)?(?:www\.)?youtube\.com/watch\?v=[\w-]+',
            r'(?:https?://)?(?:www\.)?youtu\.be/[\w-]+',
            r'(?:https?://)?(?:www\.)?youtube\.com/embed/[\w-]+'
        ]
        
        return any(re.match(pattern, url) for pattern in youtube_patterns)
    
    def get_basic_info(self, url: str) -> Dict[str, Any]:
        """Get basic video information (title and duration only).
        
        Args:
            url: YouTube video URL
            
        Returns:
            Dict containing basic video information
        """
        try:
            with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                return {
                    'title': info.get('title', 'Unknown Title'),
                    'duration': info.get('duration', 0),
                    'duration_formatted': self._format_duration(info.get('duration', 0))
                }
        except Exception as e:
            return {
                'title': 'Error retrieving video info',
                'duration': 0,
                'duration_formatted': '00:00:00',
                'error': str(e)
            }
    
    def validate_and_normalize_url(self, url: str) -> Optional[str]:
        """Validate and normalize YouTube URL.
        
        Args:
            url: YouTube URL to validate and normalize
            
        Returns:
            Normalized URL or None if invalid
        """
        if not self.is_valid_youtube_url(url):
            return None
        
        video_id = self._extract_video_id(url)
        if not video_id:
            return None
        
        return f"https://www.youtube.com/watch?v={video_id}"
    
    def get_playlist_info(self, url: str) -> Dict[str, Any]:
        """Get playlist information if URL is a playlist.
        
        Args:
            url: YouTube playlist URL
            
        Returns:
            Dict containing playlist information
        """
        if 'playlist' not in url:
            return {'error': 'Not a playlist URL'}
        
        try:
            ydl_opts = self.ydl_opts.copy()
            ydl_opts['extract_flat'] = True
            
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)
                
                entries = info.get('entries', [])
                
                return {
                    'title': info.get('title', 'Unknown Playlist'),
                    'uploader': info.get('uploader', ''),
                    'video_count': len(entries),
                    'videos': [{
                        'title': entry.get('title', 'Unknown'),
                        'id': entry.get('id', ''),
                        'url': f"https://www.youtube.com/watch?v={entry.get('id', '')}"
                    } for entry in entries[:10]]  # Limit to first 10 videos
                }
        except Exception as e:
            return {'error': f'Failed to extract playlist information: {str(e)}'}
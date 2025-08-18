"""URL Data Extraction Modules

This package contains modules for extracting and processing YouTube video data:
- clean_transcriber: Extract and clean YouTube video transcripts
- video_info: Extract comprehensive video information
- audio_transcriber: Extract and transcribe audio from videos
- database_manager: Handle database operations for transcripts
"""

from .clean_transcriber import CleanYouTubeTranscriber
from .video_info import VideoInfoExtractor
from .audio_transcriber import AudioTranscriber
from .database_manager import DatabaseManager

__all__ = [
    'CleanYouTubeTranscriber',
    'VideoInfoExtractor', 
    'AudioTranscriber',
    'DatabaseManager'
]

__version__ = '1.0.0'
__author__ = 'Summarizer Team'
__description__ = 'YouTube video data extraction and transcription modules'
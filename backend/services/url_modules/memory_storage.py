from datetime import datetime
from typing import Dict, List, Optional
import uuid

class MemoryStorage:
    """Simple in-memory storage for transcripts when MongoDB is not available."""
    
    def __init__(self):
        self.transcripts = {}
    
    def save_transcript(self, video_url: str, video_title: str, transcript_content: str, 
                      video_info: dict, duration: int) -> str:
        """Save transcript to memory storage."""
        transcript_id = str(uuid.uuid4())
        
        transcript_data = {
            '_id': transcript_id,
            'transcript_id': transcript_id,
            'video_url': video_url,
            'video_title': video_title,
            'transcript_content': transcript_content,
            'video_info': video_info,
            'duration': duration,
            'word_count': len(transcript_content.split()) if transcript_content else 0,
            'created_at': datetime.now(),
            'updated_at': datetime.now()
        }
        
        self.transcripts[transcript_id] = transcript_data
        return transcript_id
    
    def get_transcript_by_url(self, video_url: str) -> Optional[dict]:
        """Get transcript by video URL."""
        for transcript in self.transcripts.values():
            if transcript['video_url'] == video_url:
                return transcript
        return None
    
    def get_transcript_by_id(self, transcript_id: str) -> Optional[dict]:
        """Get transcript by ID."""
        return self.transcripts.get(transcript_id)
    
    def search_transcripts(self, query: str) -> List[dict]:
        """Search transcripts by query."""
        results = []
        query_lower = query.lower()
        
        for transcript in self.transcripts.values():
            if (query_lower in transcript['video_title'].lower() or 
                query_lower in transcript['transcript_content'].lower()):
                results.append(transcript)
        
        return results
    
    def get_all_transcripts(self) -> List[dict]:
        """Get all transcripts."""
        return list(self.transcripts.values())
    
    def delete_transcript(self, transcript_id: str) -> bool:
        """Delete transcript by ID."""
        if transcript_id in self.transcripts:
            del self.transcripts[transcript_id]
            return True
        return False
    
    def get_transcript_count(self) -> int:
        """Get total number of transcripts."""
        return len(self.transcripts)
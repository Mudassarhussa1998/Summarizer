from pymongo import MongoClient
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
import sys
import os

# Add the parent directory to the path to import from models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import memory storage as fallback
from .memory_storage import MemoryStorage

class DatabaseManager:
    """Handles all database operations for YouTube transcripts with MongoDB and memory fallback."""
    
    def __init__(self):
        """Initialize database manager with MongoDB or memory fallback."""
        self.use_memory = False
        self.memory_storage = None
        
        try:
            from models.db import transcripts_collection
            self.transcripts_collection = transcripts_collection
            # Test the connection
            self.transcripts_collection.find_one()
        except Exception as e:
            self.use_memory = True
            self.memory_storage = MemoryStorage()
    
    def store_transcript(self, video_title: str, video_url: str, duration: int, 
                       transcript_content: str, video_info: Dict[str, Any] = None, user_id: str = None) -> str:
        """Store transcript data in MongoDB or memory storage.
        
        Args:
            video_title: Title of the YouTube video
            video_url: URL of the YouTube video
            duration: Duration of the video in seconds
            transcript_content: The actual transcript text
            video_info: Additional video information
            user_id: ID of the user who created the transcript
            
        Returns:
            str: The inserted document ID
        """
        try:
            if self.use_memory:
                return self.memory_storage.save_transcript(
                    video_url, video_title, transcript_content, video_info or {}, duration
                )
            else:
                # Format duration
                duration_formatted = self._format_duration(duration) if isinstance(duration, int) else duration
                
                transcript_doc = {
                    'video_title': video_title,
                    'video_url': video_url,
                    'duration': duration,
                    'duration_formatted': duration_formatted,
                    'transcript_content': transcript_content,
                    'user_id': user_id,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow(),
                    'file_size': len(transcript_content.encode('utf-8')),
                    'word_count': len(transcript_content.split()) if transcript_content else 0,
                    'character_count': len(transcript_content) if transcript_content else 0,
                    'video_info': video_info or {},
                    'status': 'completed',
                    'extraction_method': video_info.get('extraction_method', 'captions') if video_info else 'captions'
                }
                
                result = self.transcripts_collection.insert_one(transcript_doc)
                return str(result.inserted_id)
            
        except Exception as e:
            raise
    
    def get_transcript_by_id(self, transcript_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve transcript by ID.
        
        Args:
            transcript_id: The transcript document ID
            
        Returns:
            Dict containing transcript data or None if not found
        """
        try:
            if self.use_memory:
                return self.memory_storage.get_transcript_by_id(transcript_id)
            else:
                return self.transcripts_collection.find_one({'_id': ObjectId(transcript_id)})
        except Exception as e:
            return None
    
    def get_transcript_by_title(self, video_title: str) -> Optional[Dict[str, Any]]:
        """Retrieve transcript by video title.
        
        Args:
            video_title: Title of the video to search for
            
        Returns:
            Dict containing transcript data or None if not found
        """
        try:
            return self.transcripts_collection.find_one({'video_title': video_title})
        except Exception as e:
            return None
    
    def get_transcript_by_url(self, video_url: str) -> Optional[Dict[str, Any]]:
        """Retrieve transcript by video URL.
        
        Args:
            video_url: URL of the video to search for
            
        Returns:
            Dict containing transcript data or None if not found
        """
        try:
            if self.use_memory:
                return self.memory_storage.get_transcript_by_url(video_url)
            else:
                return self.transcripts_collection.find_one({'video_url': video_url})
        except Exception as e:
            return None
    
    def get_all_transcripts(self, limit: int = 100, skip: int = 0) -> List[Dict[str, Any]]:
        """Get all stored transcripts with pagination.
        
        Args:
            limit: Maximum number of transcripts to return
            skip: Number of transcripts to skip
            
        Returns:
            List of transcript documents
        """
        try:
            return list(self.transcripts_collection.find()
                       .sort('created_at', -1)
                       .limit(limit)
                       .skip(skip))
        except Exception as e:
            return []
    
    def search_transcripts(self, search_term: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Search transcripts by content or title.
        
        Args:
            search_term: Term to search for
            limit: Maximum number of results to return
            
        Returns:
            List of matching transcript documents
        """
        try:
            return list(self.transcripts_collection.find({
                '$or': [
                    {'video_title': {'$regex': search_term, '$options': 'i'}},
                    {'transcript_content': {'$regex': search_term, '$options': 'i'}},
                    {'video_info.uploader': {'$regex': search_term, '$options': 'i'}},
                    {'video_info.tags': {'$regex': search_term, '$options': 'i'}}
                ]
            }).sort('created_at', -1).limit(limit))
        except Exception as e:
            return []
    
    def delete_transcript(self, transcript_id: str) -> bool:
        """Delete a transcript by ID.
        
        Args:
            transcript_id: The transcript document ID
            
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            result = self.transcripts_collection.delete_one({'_id': ObjectId(transcript_id)})
            return result.deleted_count > 0
        except Exception as e:
            return False
    
    def update_transcript(self, transcript_id: str, updates: Dict[str, Any]) -> bool:
        """Update a transcript document.
        
        Args:
            transcript_id: The transcript document ID
            updates: Dictionary of fields to update
            
        Returns:
            True if updated successfully, False otherwise
        """
        try:
            updates['updated_at'] = datetime.utcnow()
            result = self.transcripts_collection.update_one(
                {'_id': ObjectId(transcript_id)},
                {'$set': updates}
            )
            return result.modified_count > 0
        except Exception as e:
            return False
    
    def get_transcripts_by_uploader(self, uploader: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get transcripts by video uploader/channel.
        
        Args:
            uploader: Name of the uploader/channel
            limit: Maximum number of results to return
            
        Returns:
            List of transcript documents
        """
        try:
            return list(self.transcripts_collection.find({
                'video_info.uploader': {'$regex': uploader, '$options': 'i'}
            }).sort('created_at', -1).limit(limit))
        except Exception as e:
            return []
    
    def get_transcripts_by_date_range(self, start_date: datetime, end_date: datetime) -> List[Dict[str, Any]]:
        """Get transcripts created within a date range.
        
        Args:
            start_date: Start date for the range
            end_date: End date for the range
            
        Returns:
            List of transcript documents
        """
        try:
            return list(self.transcripts_collection.find({
                'created_at': {
                    '$gte': start_date,
                    '$lte': end_date
                }
            }).sort('created_at', -1))
        except Exception as e:
            return []
    
    def get_transcript_statistics(self) -> Dict[str, Any]:
        """Get statistics about stored transcripts.
        
        Returns:
            Dict containing various statistics
        """
        try:
            pipeline = [
                {
                    '$group': {
                        '_id': None,
                        'total_transcripts': {'$sum': 1},
                        'total_words': {'$sum': '$word_count'},
                        'total_characters': {'$sum': '$character_count'},
                        'total_file_size': {'$sum': '$file_size'},
                        'avg_duration': {'$avg': '$duration'},
                        'avg_word_count': {'$avg': '$word_count'}
                    }
                }
            ]
            
            result = list(self.transcripts_collection.aggregate(pipeline))
            
            if result:
                stats = result[0]
                stats.pop('_id', None)
                
                # Add additional statistics
                stats['avg_duration_formatted'] = self._format_duration(int(stats.get('avg_duration', 0)))
                stats['total_file_size_mb'] = round(stats.get('total_file_size', 0) / (1024 * 1024), 2)
                
                return stats
            else:
                return {
                    'total_transcripts': 0,
                    'total_words': 0,
                    'total_characters': 0,
                    'total_file_size': 0,
                    'total_file_size_mb': 0,
                    'avg_duration': 0,
                    'avg_duration_formatted': '00:00:00',
                    'avg_word_count': 0
                }
                
        except Exception as e:
            return {}
    
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
    
    def create_indexes(self):
        """Create database indexes for better performance."""
        try:
            # Create indexes for common queries
            self.transcripts_collection.create_index('video_url')
            self.transcripts_collection.create_index('video_title')
            self.transcripts_collection.create_index('created_at')
            self.transcripts_collection.create_index([('video_title', 'text'), ('transcript_content', 'text')])
        except Exception as e:
            pass
    
    def cleanup_old_transcripts(self, days_old: int = 30) -> int:
        """Clean up transcripts older than specified days.
        
        Args:
            days_old: Number of days to keep transcripts
            
        Returns:
            Number of transcripts deleted
        """
        try:
            cutoff_date = datetime.utcnow() - timedelta(days=days_old)
            result = self.transcripts_collection.delete_many({
                'created_at': {'$lt': cutoff_date}
            })
            return result.deleted_count
        except Exception as e:
            return 0
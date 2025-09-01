from pymongo import MongoClient
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from bson import ObjectId
import sys
import os
import uuid

# Add the parent directory to the path to import from models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import memory storage as fallback
from .memory_storage import MemoryStorage
import re
from collections import Counter
from textblob import TextBlob

class DatabaseManager:
    """Handles all database operations for YouTube transcripts with MongoDB and memory fallback."""
    
    def __init__(self):
        """Initialize database manager with MongoDB or memory fallback."""
        self.use_memory = False
        self.memory_storage = None
        
        try:
            from models.db import Url_transcripts_collection, video_data_collection
            print("Attempting to connect to MongoDB...")
            self.transcripts_collection = Url_transcripts_collection
            self.video_data_collection = video_data_collection
            # Test the connection
            self.transcripts_collection.find_one()
            print("Successfully connected to MongoDB")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {str(e)}")
            print("Falling back to memory storage")
            self.use_memory = True
            self.memory_storage = MemoryStorage()
    
    def _extract_structured_data(self, transcript_content: str, video_info: Dict[str, Any] = None) -> Dict[str, Any]:
        """Extract structured insights from transcript content."""
        if not transcript_content or transcript_content.startswith('Error:'):
            return {}
        
        try:
            # Extract keywords using simple frequency analysis
            words = re.findall(r'\b[a-zA-Z]{3,}\b', transcript_content.lower())
            # Filter out common stop words
            stop_words = {'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use'}
            filtered_words = [word for word in words if word not in stop_words and len(word) > 3]
            word_freq = Counter(filtered_words)
            top_keywords = [word for word, count in word_freq.most_common(10)]
            
            # Basic sentiment analysis
            blob = TextBlob(transcript_content[:1000])  # Analyze first 1000 chars for performance
            sentiment_score = blob.sentiment.polarity  # -1 to 1
            sentiment_label = 'positive' if sentiment_score > 0.1 else 'negative' if sentiment_score < -0.1 else 'neutral'
            
            # Extract topics/themes based on keywords
            tech_keywords = ['technology', 'software', 'programming', 'computer', 'digital', 'internet', 'app', 'website', 'code', 'data']
            education_keywords = ['learn', 'education', 'tutorial', 'course', 'lesson', 'teach', 'study', 'school', 'university']
            business_keywords = ['business', 'marketing', 'sales', 'company', 'entrepreneur', 'startup', 'finance', 'money']
            entertainment_keywords = ['music', 'movie', 'game', 'entertainment', 'fun', 'comedy', 'drama', 'sport']
            
            detected_topics = []
            transcript_lower = transcript_content.lower()
            if any(keyword in transcript_lower for keyword in tech_keywords):
                detected_topics.append('Technology')
            if any(keyword in transcript_lower for keyword in education_keywords):
                detected_topics.append('Education')
            if any(keyword in transcript_lower for keyword in business_keywords):
                detected_topics.append('Business')
            if any(keyword in transcript_lower for keyword in entertainment_keywords):
                detected_topics.append('Entertainment')
            
            # Extract key phrases (simple approach)
            sentences = re.split(r'[.!?]+', transcript_content)
            key_phrases = []
            for sentence in sentences[:5]:  # First 5 sentences
                sentence = sentence.strip()
                if len(sentence) > 20 and len(sentence) < 150:
                    key_phrases.append(sentence)
            
            return {
                'keywords': top_keywords,
                'sentiment': {
                    'score': round(sentiment_score, 3),
                    'label': sentiment_label
                },
                'topics': detected_topics,
                'key_phrases': key_phrases[:3],  # Top 3 key phrases
                'language_detected': str(blob.detect_language()) if len(transcript_content) > 50 else 'en',
                'readability_score': self._calculate_readability(transcript_content)
            }
        except Exception as e:
            print(f"Error extracting structured data: {str(e)}")
            return {}
    
    def _calculate_readability(self, text: str) -> float:
        """Calculate a simple readability score (0-100, higher = more readable)."""
        try:
            sentences = len(re.split(r'[.!?]+', text))
            words = len(text.split())
            if sentences == 0 or words == 0:
                return 0
            
            avg_sentence_length = words / sentences
            # Simple readability approximation
            score = max(0, min(100, 100 - (avg_sentence_length * 2)))
            return round(score, 1)
        except:
            return 50.0  # Default middle score
    
    def store_transcript(self, video_title: str, video_url: str, duration: int, 
                       transcript_content: str, video_info: Dict[str, Any] = None, user_id: str = None) -> str:
        try:
            if self.use_memory:
                print(f"Storing transcript in memory storage for video: {video_title}")
                return self.memory_storage.save_transcript(
                    video_url, video_title, transcript_content, video_info or {}, duration
                )
            else:
                print(f"Storing transcript in MongoDB for video: {video_title}")
                # Format duration
                duration_formatted = self._format_duration(duration) if isinstance(duration, int) else duration
                
                # Extract structured insights
                structured_data = self._extract_structured_data(transcript_content, video_info)
                
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
                    'extraction_method': video_info.get('extraction_method', 'captions') if video_info else 'captions',
                    # Enhanced structured data
                    'structured_data': structured_data
                }
                
                result = self.transcripts_collection.insert_one(transcript_doc)
                print(f"Successfully stored transcript in MongoDB with ID: {result.inserted_id}")
                
                print("Storing video data in categorical format...")
                categorical_id = self.store_video_data_categorical(
                    video_title=video_title,
                    video_url=video_url,
                    duration=duration,
                    transcript=transcript_content,
                    description=video_info.get('description', '') if video_info else '',
                    user_id=user_id,
                    source_type='url',
                    source_id=str(result.inserted_id),
                    structured_data=structured_data
                )
                print(f"Successfully stored categorical data with ID: {categorical_id}")
                
                return str(result.inserted_id)
            
        except Exception as e:
            print(f"Error storing transcript: {str(e)}")
            raise
    
    def store_video_data_categorical(self, video_title: str, video_url: str = None, 
                                   duration: int = None, transcript: str = None,
                                   description: str = None, user_id: str = None,
                                   source_type: str = 'url', source_id: str = None,
                                   structured_data: Dict[str, Any] = None) -> str:
        """Store video data in a categorical format with enhanced structured data."""
        try:
            if self.use_memory:
                # Not implemented for memory storage
                return None
            else:
                # Format duration
                duration_formatted = self._format_duration(duration) if isinstance(duration, int) else duration
                
                # Generate a unique ID for the video
                video_unique_id = str(uuid.uuid4())
                
                video_data_doc = {
                    'video_id': video_unique_id,
                    'name': video_title,
                    'url': video_url,
                    'description': description,
                    'transcript': transcript,
                    'duration': duration,
                    'duration_formatted': duration_formatted,
                    'user_id': user_id,
                    'created_at': datetime.utcnow(),
                    'updated_at': datetime.utcnow(),
                    'source_type': source_type,  # 'url' or 'upload'
                    'source_id': source_id,      # ID in the original collection
                    'word_count': len(transcript.split()) if transcript else 0,
                    'character_count': len(transcript) if transcript else 0,
                    # Enhanced structured data
                    'structured_data': structured_data or {},
                    'keywords': structured_data.get('keywords', []) if structured_data else [],
                    'topics': structured_data.get('topics', []) if structured_data else [],
                    'sentiment': structured_data.get('sentiment', {}) if structured_data else {},
                    'language': structured_data.get('language_detected', 'en') if structured_data else 'en'
                }
                
                result = self.video_data_collection.insert_one(video_data_doc)
                return str(result.inserted_id)
                
        except Exception as e:
            raise
    
    def get_structured_data_summary(self, user_id: str) -> Dict[str, Any]:
        """Get a summary of all structured data for a user."""
        try:
            if self.use_memory:
                return {'error': 'Not available in memory mode'}
            
            # Aggregate data from video_data_collection
            pipeline = [
                {'$match': {'user_id': user_id}},
                {'$group': {
                    '_id': None,
                    'total_videos': {'$sum': 1},
                    'total_duration': {'$sum': '$duration'},
                    'total_words': {'$sum': '$word_count'},
                    'all_topics': {'$push': '$topics'},
                    'all_keywords': {'$push': '$keywords'},
                    'sentiment_scores': {'$push': '$sentiment.score'}
                }}
            ]
            
            result = list(self.video_data_collection.aggregate(pipeline))
            if not result:
                return {'total_videos': 0, 'message': 'No data found'}
            
            data = result[0]
            
            # Flatten and count topics
            all_topics = [topic for topics_list in data.get('all_topics', []) for topic in topics_list if topics_list]
            topic_counts = Counter(all_topics)
            
            # Flatten and count keywords
            all_keywords = [keyword for keywords_list in data.get('all_keywords', []) for keyword in keywords_list if keywords_list]
            keyword_counts = Counter(all_keywords)
            
            # Calculate average sentiment
            sentiment_scores = [score for score in data.get('sentiment_scores', []) if score is not None]
            avg_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0
            
            return {
                'total_videos': data.get('total_videos', 0),
                'total_duration_hours': round(data.get('total_duration', 0) / 3600, 2),
                'total_words': data.get('total_words', 0),
                'top_topics': dict(topic_counts.most_common(5)),
                'top_keywords': dict(keyword_counts.most_common(10)),
                'average_sentiment': round(avg_sentiment, 3),
                'sentiment_distribution': {
                    'positive': len([s for s in sentiment_scores if s > 0.1]),
                    'neutral': len([s for s in sentiment_scores if -0.1 <= s <= 0.1]),
                    'negative': len([s for s in sentiment_scores if s < -0.1])
                }
            }
            
        except Exception as e:
            return {'error': f'Failed to get summary: {str(e)}'}
    
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
            print(f"Error creating indexes: {str(e)}")
            raise
    
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
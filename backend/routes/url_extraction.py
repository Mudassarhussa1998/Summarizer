from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
import json
import jwt
import os

def serialize_mongo_doc(doc):
    """Convert MongoDB document to JSON serializable format."""
    if doc is None:
        return None
    if isinstance(doc, dict):
        result = {}
        for key, value in doc.items():
            if isinstance(value, ObjectId):
                result[key] = str(value)
            elif isinstance(value, dict):
                result[key] = serialize_mongo_doc(value)
            elif isinstance(value, list):
                result[key] = [serialize_mongo_doc(item) if isinstance(item, dict) else str(item) if isinstance(item, ObjectId) else item for item in value]
            else:
                result[key] = value
        return result
    return doc

# Import our URL extraction modules
from services.url_modules.clean_transcriber import CleanYouTubeTranscriber
from services.url_modules.video_info import VideoInfoExtractor
from services.url_modules.audio_transcriber import AudioTranscriber
from services.url_modules.database_manager import DatabaseManager

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')

def verify_token(token):
    """Verify JWT token and return user data."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_from_request():
    """Extract user data from request headers."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    return verify_token(token)

url_extraction_bp = Blueprint('url_extraction', __name__)

# Initialize components
transcriber = CleanYouTubeTranscriber()
video_extractor = VideoInfoExtractor()
audio_transcriber = AudioTranscriber()
db_manager = DatabaseManager()

@url_extraction_bp.route('/extract-transcript', methods=['POST'])
def extract_transcript():
    """Extract transcript from YouTube URL for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        data = request.get_json()
        url = data.get('url')
        method = data.get('method', 'captions')  # 'captions' or 'audio'
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Get video information
        video_info = video_extractor.get_video_info(url)
        
        if 'error' in video_info:
            # Check if it's a network connectivity issue
            if 'Network connectivity issue' in video_info['error']:
                return jsonify({
                    'error': 'Unable to connect to YouTube. This may be due to network restrictions or temporary connectivity issues. Please try again later.',
                    'error_type': 'network_error',
                    'retry_suggested': True
                }), 503  # Service Unavailable
            else:
                return jsonify({'error': video_info['error']}), 400
        
        # Check if transcript already exists
        existing = db_manager.get_transcript_by_url(url)
        if existing:
            existing_data = serialize_mongo_doc(existing)
            return jsonify({
                'message': 'Transcript loaded from cache',
                'transcript_id': existing_data.get('_id'),
                'video_info': existing_data.get('video_info', video_info),
                'transcript_preview': existing_data.get('transcript_content', '')[:500] + '...' if len(existing_data.get('transcript_content', '')) > 500 else existing_data.get('transcript_content', ''),
                'transcript_content': existing_data.get('transcript_content', ''),
                'from_cache': True
            }), 200
        
        # Extract transcript based on method
        if method == 'captions':
            transcript_text = transcriber.extract_clean_captions(url)
        elif method == 'audio':
            transcript_text = audio_transcriber.download_and_transcribe_audio(url)
        else:
            return jsonify({'error': 'Invalid method. Use "captions" or "audio"'}), 400
        
        if not transcript_text:
            return jsonify({
                'error': 'Unable to extract transcript. This may be due to network connectivity issues, missing captions, or video restrictions. Please try again later or try the audio transcription method.',
                'error_type': 'extraction_failed',
                'retry_suggested': True,
                'alternative_method': 'audio' if method == 'captions' else 'captions'
            }), 503
        
        # Add debug logging
        print("Attempting to store transcript...")
        
        # Store transcript with user_id
        # Add more logging before storage
        print(f"Storing transcript for video: {video_info['title']}")
        transcript_id = db_manager.store_transcript(
            video_title=video_info['title'],
            video_url=url,
            duration=video_info.get('duration', 0),
            transcript_content=transcript_text,
            video_info=video_info,
            user_id=user_id
        )
        print(f"Successfully stored transcript with ID: {transcript_id}")
        
        return jsonify({
            'message': 'Transcript extracted successfully',
            'transcript_id': str(transcript_id),
            'video_info': video_info,
            'transcript_preview': transcript_text[:500] + '...' if len(transcript_text) > 500 else transcript_text,
            'transcript_content': transcript_text
        }), 200
    except Exception as e:
        print(f"Error in extract_transcript: {str(e)}")
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
        
        return jsonify({
            'message': 'Transcript extracted successfully',
            'transcript_id': str(transcript_id),
            'video_info': video_info,
            'transcript_preview': transcript_text[:500] + '...' if len(transcript_text) > 500 else transcript_text,
            'transcript_content': transcript_text
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/get-transcript/<transcript_id>', methods=['GET'])
def get_transcript(transcript_id):
    """Get transcript by ID for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Get transcript only if it belongs to the authenticated user
        from models.db import Url_transcripts_collection
        transcript = Url_transcripts_collection.find_one({
            '_id': ObjectId(transcript_id),
            'user_id': user_id
        })
        
        if not transcript:
            return jsonify({'error': 'Transcript not found'}), 404
        
        return jsonify({'transcript': serialize_mongo_doc(transcript)}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/search-transcripts', methods=['GET'])
def search_transcripts():
    """Search transcripts by title or content for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        search_term = request.args.get('q', '')
        if not search_term:
            return jsonify({'error': 'Search term is required'}), 400
        
        # Search with user_id filter
        from models.db import Url_transcripts_collection
        results = list(Url_transcripts_collection.find({
            'user_id': user_id,
            '$or': [
                {'video_title': {'$regex': search_term, '$options': 'i'}},
                {'transcript_content': {'$regex': search_term, '$options': 'i'}},
                {'video_info.uploader': {'$regex': search_term, '$options': 'i'}},
                {'video_info.tags': {'$regex': search_term, '$options': 'i'}}
            ]
        }).sort('created_at', -1))
        
        return jsonify({
            'results': [serialize_mongo_doc(result) for result in results],
            'count': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/get-all-transcripts', methods=['GET'])
def get_all_transcripts():
    """Get all stored transcripts for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Get transcripts filtered by user_id
        from models.db import Url_transcripts_collection
        transcripts = list(Url_transcripts_collection.find({'user_id': user_id}).sort('created_at', -1))
        
        return jsonify({
            'transcripts': [serialize_mongo_doc(transcript) for transcript in transcripts],
            'count': len(transcripts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/delete-transcript/<transcript_id>', methods=['DELETE'])
def delete_transcript(transcript_id):
    """Delete transcript by ID for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Delete only if the transcript belongs to the authenticated user
        from models.db import Url_transcripts_collection, video_data_collection
        
        # First find the transcript to get its ID
        transcript = Url_transcripts_collection.find_one({
            '_id': ObjectId(transcript_id),
            'user_id': user_id
        })
        
        if not transcript:
            return jsonify({'error': 'Transcript not found or access denied'}), 404
            
        # Delete from main collection
        result = Url_transcripts_collection.delete_one({
            '_id': ObjectId(transcript_id),
            'user_id': user_id
        })
        
        # Also delete from categorical collection
        video_data_collection.delete_many({
            'source_id': str(transcript_id),
            'user_id': user_id
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Transcript not found or access denied'}), 404
        
        return jsonify({'message': 'Transcript deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/get-video-info', methods=['POST'])
def get_video_info():
    """Get video information without extracting transcript."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
            
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        video_info = video_extractor.get_video_info(url)
        
        if 'error' in video_info:
            return jsonify({'error': video_info['error']}), 400
        
        # Store in categorical format without transcript
        db_manager.store_video_data_categorical(
            video_title=video_info['title'],
            video_url=url,
            duration=video_info.get('duration', 0),
            transcript=None,
            description=video_info.get('description', ''),
            user_id=user_id,
            source_type='url',
            source_id=None
        )
        
        return jsonify({'video_info': video_info}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/get-categorical-videos', methods=['GET'])
def get_categorical_videos():
    """Get all videos from the categorical collection for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Get videos filtered by user_id
        from models.db import video_data_collection
        videos = list(video_data_collection.find({'user_id': user_id}).sort('created_at', -1))
        
        return jsonify({
            'videos': [serialize_mongo_doc(video) for video in videos],
            'count': len(videos)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/search-categorical-videos', methods=['GET'])
def search_categorical_videos():
    """Search videos in the categorical collection by various fields."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        search_term = request.args.get('q', '')
        if not search_term:
            return jsonify({'error': 'Search term is required'}), 400
        
        # Search with user_id filter
        from models.db import video_data_collection
        results = list(video_data_collection.find({
            'user_id': user_id,
            '$or': [
                {'name': {'$regex': search_term, '$options': 'i'}},
                {'description': {'$regex': search_term, '$options': 'i'}},
                {'transcript': {'$regex': search_term, '$options': 'i'}}
            ]
        }).sort('created_at', -1))
        
        return jsonify({
            'results': [serialize_mongo_doc(result) for result in results],
            'count': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/get-categorical-video/<video_id>', methods=['GET'])
def get_categorical_video(video_id):
    """Get a specific video from the categorical collection by ID."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Get video by ID and user_id
        from models.db import video_data_collection
        video = video_data_collection.find_one({
            'video_id': video_id,
            'user_id': user_id
        })
        
        if not video:
            return jsonify({'error': 'Video not found or access denied'}), 404
        
        return jsonify({
            'video': serialize_mongo_doc(video)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/delete-categorical-video/<video_id>', methods=['DELETE'])
def delete_categorical_video(video_id):
    """Delete a specific video from the categorical collection by ID."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Delete video by ID and user_id
        from models.db import video_data_collection
        result = video_data_collection.delete_one({
            'video_id': video_id,
            'user_id': user_id
        })
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Video not found or access denied'}), 404
        
        return jsonify({'message': 'Video deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/get-structured-summary', methods=['GET'])
def get_structured_summary():
    """Get structured data summary for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Get structured summary
        summary = db_manager.get_structured_data_summary(user_id)
        
        return jsonify({
            'summary': summary,
            'message': 'Structured data summary retrieved successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/get-all-structured-data', methods=['GET'])
def get_all_structured_data():
    """Get all videos with structured data for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Get all structured data
        from models.db import video_data_collection
        videos = list(video_data_collection.find(
            {'user_id': user_id}
        ).sort('created_at', -1))
        
        return jsonify({
            'videos': [serialize_mongo_doc(video) for video in videos],
            'count': len(videos),
            'message': 'All structured data retrieved successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
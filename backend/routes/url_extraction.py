from flask import Blueprint, request, jsonify
from datetime import datetime
from bson import ObjectId
import json

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

url_extraction_bp = Blueprint('url_extraction', __name__)

# Initialize components
transcriber = CleanYouTubeTranscriber()
video_extractor = VideoInfoExtractor()
audio_transcriber = AudioTranscriber()
db_manager = DatabaseManager()

@url_extraction_bp.route('/extract-transcript', methods=['POST'])
def extract_transcript():
    """Extract transcript from YouTube URL."""
    try:
        data = request.get_json()
        url = data.get('url')
        method = data.get('method', 'captions')  # 'captions' or 'audio'
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        # Get video information
        video_info = video_extractor.get_video_info(url)
        
        if 'error' in video_info:
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
            return jsonify({'error': 'Failed to extract transcript'}), 500
        
        # Store transcript
        transcript_id = db_manager.store_transcript(
            video_title=video_info['title'],
            video_url=url,
            duration=video_info.get('duration', 0),
            transcript_content=transcript_text,
            video_info=video_info
        )
        
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
    """Get transcript by ID."""
    try:
        transcript = db_manager.get_transcript_by_id(transcript_id)
        if not transcript:
            return jsonify({'error': 'Transcript not found'}), 404
        
        return jsonify({'transcript': serialize_mongo_doc(transcript)}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/search-transcripts', methods=['GET'])
def search_transcripts():
    """Search transcripts by title or content."""
    try:
        search_term = request.args.get('q', '')
        if not search_term:
            return jsonify({'error': 'Search term is required'}), 400
        
        results = db_manager.search_transcripts(search_term)
        
        return jsonify({
            'results': [serialize_mongo_doc(result) for result in results],
            'count': len(results)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/get-all-transcripts', methods=['GET'])
def get_all_transcripts():
    """Get all stored transcripts."""
    try:
        transcripts = db_manager.get_all_transcripts()
        
        return jsonify({
            'transcripts': [serialize_mongo_doc(transcript) for transcript in transcripts],
            'count': len(transcripts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/delete-transcript/<transcript_id>', methods=['DELETE'])
def delete_transcript(transcript_id):
    """Delete transcript by ID."""
    try:
        result = db_manager.delete_transcript(transcript_id)
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Transcript not found'}), 404
        
        return jsonify({'message': 'Transcript deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@url_extraction_bp.route('/get-video-info', methods=['POST'])
def get_video_info():
    """Get video information without extracting transcript."""
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        video_info = video_extractor.get_video_info(url)
        
        if 'error' in video_info:
            return jsonify({'error': video_info['error']}), 400
        
        return jsonify({'video_info': video_info}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
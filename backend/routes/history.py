from flask import Blueprint, jsonify, request
from datetime import datetime
from bson import ObjectId
import sys
import os
import jwt

# Add the parent directory to the path to import from models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.db import Url_transcripts_collection, Video_transcriptions_collection
from utils.helper import serialize_user, serialize_mongo_doc

# JWT secret key (should be in environment variables in production)
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')

def verify_token(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_from_request():
    """Extract and verify user from request headers"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    return verify_token(token)

history_bp = Blueprint('history', __name__)

@history_bp.route('/get-all-history', methods=['GET'])
def get_all_history():
    """Get all processing history from both URL and video modules for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Get URL transcripts for this user
        url_transcripts = list(Url_transcripts_collection.find({'user_id': user_id}).sort('created_at', -1))
        
        # Get video transcripts for this user
        video_transcripts = list(Video_transcriptions_collection.find({'user_id': user_id}).sort('created_at', -1))
        
        # Format URL transcripts
        formatted_url_transcripts = []
        for transcript in url_transcripts:
            formatted_transcript = serialize_mongo_doc(transcript)
            formatted_transcript['type'] = 'url'
            formatted_transcript['source'] = 'YouTube URL'
            formatted_url_transcripts.append(formatted_transcript)
        
        # Format video transcripts
        formatted_video_transcripts = []
        for transcript in video_transcripts:
            formatted_transcript = serialize_mongo_doc(transcript)
            formatted_transcript['type'] = 'video'
            formatted_transcript['source'] = 'Video Upload'
            formatted_video_transcripts.append(formatted_transcript)
        
        # Combine and sort by created_at
        all_history = formatted_url_transcripts + formatted_video_transcripts
        all_history.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
        
        return jsonify({
            'history': all_history,
            'total_count': len(all_history),
            'url_count': len(formatted_url_transcripts),
            'video_count': len(formatted_video_transcripts)
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@history_bp.route('/search-history', methods=['GET'])
def search_history():
    """Search through all processing history for authenticated user."""
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
        
        # Search in URL transcripts for this user
        url_results = list(Url_transcripts_collection.find({
            'user_id': user_id,
            '$or': [
                {'video_title': {'$regex': search_term, '$options': 'i'}},
                {'transcript_content': {'$regex': search_term, '$options': 'i'}},
                {'video_url': {'$regex': search_term, '$options': 'i'}}
            ]
        }).sort('created_at', -1))
        
        # Search in video transcripts for this user
        video_results = list(Video_transcriptions_collection.find({
            'user_id': user_id,
            '$or': [
                {'video_filename': {'$regex': search_term, '$options': 'i'}},
                {'transcribed_text': {'$regex': search_term, '$options': 'i'}},
                {'language': {'$regex': search_term, '$options': 'i'}}
            ]
        }).sort('created_at', -1))
        
        # Format results
        formatted_url_results = []
        for result in url_results:
            formatted_result = serialize_mongo_doc(result)
            formatted_result['type'] = 'url'
            formatted_result['source'] = 'YouTube URL'
            formatted_url_results.append(formatted_result)
        
        formatted_video_results = []
        for result in video_results:
            formatted_result = serialize_mongo_doc(result)
            formatted_result['type'] = 'video'
            formatted_result['source'] = 'Video Upload'
            formatted_video_results.append(formatted_result)
        
        # Combine and sort
        all_results = formatted_url_results + formatted_video_results
        all_results.sort(key=lambda x: x.get('created_at', datetime.min), reverse=True)
        
        return jsonify({
            'results': all_results,
            'count': len(all_results),
            'search_term': search_term
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@history_bp.route('/get-history-by-type/<history_type>', methods=['GET'])
def get_history_by_type(history_type):
    """Get history filtered by type (url or video) for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        if history_type not in ['url', 'video']:
            return jsonify({'error': 'Invalid type. Use "url" or "video"'}), 400
        
        if history_type == 'url':
            results = list(Url_transcripts_collection.find({'user_id': user_id}).sort('created_at', -1))
            formatted_results = []
            for result in results:
                formatted_result = serialize_mongo_doc(result)
                formatted_result['type'] = 'url'
                formatted_result['source'] = 'YouTube URL'
                formatted_results.append(formatted_result)
        else:
            results = list(Video_transcriptions_collection.find({'user_id': user_id}).sort('created_at', -1))
            formatted_results = []
            for result in results:
                formatted_result = serialize_mongo_doc(result)
                formatted_result['type'] = 'video'
                formatted_result['source'] = 'Video Upload'
                formatted_results.append(formatted_result)
        
        return jsonify({
            'history': formatted_results,
            'count': len(formatted_results),
            'type': history_type
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@history_bp.route('/delete-history-item/<item_type>/<item_id>', methods=['DELETE'])
def delete_history_item(item_type, item_id):
    """Delete a history item by type and ID for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        if item_type not in ['url', 'video']:
            return jsonify({'error': 'Invalid type. Use "url" or "video"'}), 400
        
        # Delete only if the item belongs to the authenticated user
        if item_type == 'url':
            result = Url_transcripts_collection.delete_one({'_id': ObjectId(item_id), 'user_id': user_id})
        else:
            result = Video_transcriptions_collection.delete_one({'_id': ObjectId(item_id), 'user_id': user_id})
        
        if result.deleted_count == 0:
            return jsonify({'error': 'Item not found or access denied'}), 404
        
        return jsonify({'message': 'History item deleted successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500

@history_bp.route('/get-history-stats', methods=['GET'])
def get_history_stats():
    """Get statistics about processing history for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Count URL transcripts for this user
        url_count = Url_transcripts_collection.count_documents({'user_id': user_id})
        
        # Count video transcripts for this user
        video_count = Video_transcriptions_collection.count_documents({'user_id': user_id})
        
        # Get recent activity (last 7 days) for this user
        from datetime import timedelta
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        recent_url_count = Url_transcripts_collection.count_documents({
            'user_id': user_id,
            'created_at': {'$gte': seven_days_ago}
        })
        
        recent_video_count = Video_transcriptions_collection.count_documents({
            'user_id': user_id,
            'created_at': {'$gte': seven_days_ago}
        })
        
        return jsonify({
            'total_items': url_count + video_count,
            'url_transcripts': url_count,
            'video_transcripts': video_count,
            'recent_activity': {
                'last_7_days': recent_url_count + recent_video_count,
                'url_last_7_days': recent_url_count,
                'video_last_7_days': recent_video_count
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Internal server error: {str(e)}'}), 500
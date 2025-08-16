from flask import Blueprint, request, jsonify
from models.db import sessions_collection, messages_collection
from utils.helper import serialize_user
from datetime import datetime
from bson import ObjectId
import jwt
import os

session_bp = Blueprint('session', __name__)

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

@session_bp.route('/create-session', methods=['POST'])
def create_session():
    """Create a new chat session for a user"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = verify_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        data = request.get_json()
        session_name = data.get('name', f'Chat Session {datetime.now().strftime("%Y-%m-%d %H:%M")}')
        
        # Create new session
        session_doc = {
            'user_id': user_data['user_id'],
            'name': session_name,
            'created_at': datetime.now(),
            'updated_at': datetime.now(),
            'message_count': 0
        }
        
        result = sessions_collection.insert_one(session_doc)
        session_doc['_id'] = str(result.inserted_id)
        
        return jsonify({
            'success': True,
            'session': {
                'id': str(result.inserted_id),
                'name': session_name,
                'created_at': session_doc['created_at'].isoformat(),
                'message_count': 0
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/sessions', methods=['GET'])
def get_user_sessions():
    """Get all sessions for a user"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = verify_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Get all sessions for the user
        sessions = list(sessions_collection.find(
            {'user_id': user_data['user_id']}
        ).sort('updated_at', -1))
        
        # Format sessions for response
        formatted_sessions = []
        for session in sessions:
            formatted_sessions.append({
                'id': str(session['_id']),
                'name': session['name'],
                'created_at': session['created_at'].isoformat(),
                'updated_at': session['updated_at'].isoformat(),
                'message_count': session.get('message_count', 0)
            })
        
        return jsonify({
            'success': True,
            'sessions': formatted_sessions
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/delete-session/<session_id>', methods=['DELETE'])
def delete_session(session_id):
    """Delete a session and all its messages"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = verify_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Verify session belongs to user
        session = sessions_collection.find_one({
            '_id': ObjectId(session_id),
            'user_id': user_data['user_id']
        })
        
        if not session:
            return jsonify({'error': 'Session not found or access denied'}), 404
        
        # Delete all messages in the session
        messages_collection.delete_many({'session_id': session_id})
        
        # Delete the session
        sessions_collection.delete_one({'_id': ObjectId(session_id)})
        
        return jsonify({
            'success': True,
            'message': 'Session deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@session_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    """Get session details"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = verify_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Get session
        session = sessions_collection.find_one({
            '_id': ObjectId(session_id),
            'user_id': user_data['user_id']
        })
        
        if not session:
            return jsonify({'error': 'Session not found or access denied'}), 404
        
        return jsonify({
            'success': True,
            'session': {
                'id': str(session['_id']),
                'name': session['name'],
                'created_at': session['created_at'].isoformat(),
                'updated_at': session['updated_at'].isoformat(),
                'message_count': session.get('message_count', 0)
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
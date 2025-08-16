from flask import Blueprint, request, jsonify
from models.db import sessions_collection, messages_collection
from datetime import datetime
from bson import ObjectId
import jwt
import os

chat_bp = Blueprint('chat', __name__)

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

@chat_bp.route('/send-message', methods=['POST'])
def send_message():
    """Save a new message to a session"""
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
        session_id = data.get('session_id')
        message_text = data.get('message')
        message_type = data.get('type', 'text')  # text, image, video, file
        file_data = data.get('file_data')  # base64 encoded file data
        file_name = data.get('file_name')
        file_size = data.get('file_size')
        
        if not session_id or not message_text:
            return jsonify({'error': 'Session ID and message are required'}), 400
        
        # Verify session belongs to user
        session = sessions_collection.find_one({
            '_id': ObjectId(session_id),
            'user_id': user_data['user_id']
        })
        
        if not session:
            return jsonify({'error': 'Session not found or access denied'}), 404
        
        # Create message document
        message_doc = {
            'session_id': session_id,
            'user_id': user_data['user_id'],
            'message': message_text,
            'type': message_type,
            'timestamp': datetime.now(),
            'sender': 'user'
        }
        
        # Add file data if present
        if file_data and message_type != 'text':
            message_doc['file_data'] = file_data
            message_doc['file_name'] = file_name
            message_doc['file_size'] = file_size
        
        # Insert message
        result = messages_collection.insert_one(message_doc)
        
        # Update session's updated_at and message_count
        sessions_collection.update_one(
            {'_id': ObjectId(session_id)},
            {
                '$set': {'updated_at': datetime.now()},
                '$inc': {'message_count': 1}
            }
        )
        
        # Return the created message
        message_doc['_id'] = str(result.inserted_id)
        message_doc['id'] = str(result.inserted_id)
        message_doc['timestamp'] = message_doc['timestamp'].isoformat()
        
        return jsonify({
            'success': True,
            'message': {
                'id': str(result.inserted_id),
                'message': message_text,
                'type': message_type,
                'timestamp': message_doc['timestamp'],
                'sender': 'user',
                'file_name': file_name if file_data else None,
                'file_size': file_size if file_data else None
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/messages/<session_id>', methods=['GET'])
def get_messages(session_id):
    """Get all messages for a session"""
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
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 50))
        skip = (page - 1) * limit
        
        # Get messages for the session
        messages = list(messages_collection.find(
            {'session_id': session_id}
        ).sort('timestamp', 1).skip(skip).limit(limit))
        
        # Format messages for response
        formatted_messages = []
        for message in messages:
            formatted_message = {
                'id': str(message['_id']),
                'message': message['message'],
                'type': message['type'],
                'timestamp': message['timestamp'].isoformat(),
                'sender': message['sender']
            }
            
            # Add file info if present
            if message.get('file_data'):
                formatted_message['file_name'] = message.get('file_name')
                formatted_message['file_size'] = message.get('file_size')
                formatted_message['file_data'] = message['file_data']
            
            formatted_messages.append(formatted_message)
        
        # Get total message count
        total_messages = messages_collection.count_documents({'session_id': session_id})
        
        return jsonify({
            'success': True,
            'messages': formatted_messages,
            'pagination': {
                'page': page,
                'limit': limit,
                'total': total_messages,
                'has_more': skip + len(formatted_messages) < total_messages
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/delete-message/<message_id>', methods=['DELETE'])
def delete_message(message_id):
    """Delete a specific message"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = verify_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Find the message and verify ownership
        message = messages_collection.find_one({
            '_id': ObjectId(message_id),
            'user_id': user_data['user_id']
        })
        
        if not message:
            return jsonify({'error': 'Message not found or access denied'}), 404
        
        # Delete the message
        messages_collection.delete_one({'_id': ObjectId(message_id)})
        
        # Update session message count
        sessions_collection.update_one(
            {'_id': ObjectId(message['session_id'])},
            {
                '$set': {'updated_at': datetime.now()},
                '$inc': {'message_count': -1}
            }
        )
        
        return jsonify({
            'success': True,
            'message': 'Message deleted successfully'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@chat_bp.route('/add-ai-response', methods=['POST'])
def add_ai_response():
    """Add an AI response to a session (for future AI integration)"""
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
        session_id = data.get('session_id')
        response_text = data.get('response')
        
        if not session_id or not response_text:
            return jsonify({'error': 'Session ID and response are required'}), 400
        
        # Verify session belongs to user
        session = sessions_collection.find_one({
            '_id': ObjectId(session_id),
            'user_id': user_data['user_id']
        })
        
        if not session:
            return jsonify({'error': 'Session not found or access denied'}), 404
        
        # Create AI response message
        message_doc = {
            'session_id': session_id,
            'user_id': user_data['user_id'],
            'message': response_text,
            'type': 'text',
            'timestamp': datetime.now(),
            'sender': 'ai'
        }
        
        # Insert message
        result = messages_collection.insert_one(message_doc)
        
        # Update session's updated_at and message_count
        sessions_collection.update_one(
            {'_id': ObjectId(session_id)},
            {
                '$set': {'updated_at': datetime.now()},
                '$inc': {'message_count': 1}
            }
        )
        
        return jsonify({
            'success': True,
            'message': {
                'id': str(result.inserted_id),
                'message': response_text,
                'type': 'text',
                'timestamp': message_doc['timestamp'].isoformat(),
                'sender': 'ai'
            }
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
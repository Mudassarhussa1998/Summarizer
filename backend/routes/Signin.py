from flask import Blueprint, request, jsonify
from models.db import users_collection
from utils.helper import serialize_user
import bcrypt
import jwt
import os
from datetime import datetime, timedelta

login_bp = Blueprint('login_bp', __name__)

# JWT secret key (should be in environment variables in production)
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')

@login_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not all([email, password]):
            return jsonify({'error': 'Email and password are required'}), 400

        user = users_collection.find_one({'email': email})
        if user and bcrypt.checkpw(password.encode('utf-8'), user['password']):
            # Generate JWT token
            user_data = serialize_user({k: v for k, v in user.items() if k != 'password'})
            payload = {
                'user_id': str(user['_id']),
                'email': user['email'],
                'exp': datetime.utcnow() + timedelta(days=7)  # Token expires in 7 days
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm='HS256')
            
            return jsonify({
                'message': 'Login successful',
                'user': user_data,
                'token': token
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

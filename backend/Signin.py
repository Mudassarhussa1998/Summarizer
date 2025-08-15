from flask import Blueprint, request, jsonify
from models.db import users_collection
from utils.helper import serialize_user
import bcrypt

login_bp = Blueprint('login_bp', __name__)

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
            return jsonify({
                'message': 'Login successful',
                'user': serialize_user({k: v for k, v in user.items() if k != 'password'})
            }), 200
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

    except Exception as e:
        return jsonify({'error': str(e)}), 500

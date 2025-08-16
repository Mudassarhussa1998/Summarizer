from flask import Blueprint, request, jsonify
from models.db import users_collection
from utils.otp_utils import generate_otp, send_otp_email, save_otp
import bcrypt
from datetime import datetime

signup_bp = Blueprint('signup_bp', __name__)

@signup_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        photo = data.get('photo')

        if not all([name, email, password]):
            return jsonify({'error': 'Name, email, and password are required'}), 400

        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'Email already registered'}), 409

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        user = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'photo': photo,
            'verified': False,
            'created_at': datetime.now()
        }
        users_collection.insert_one(user)

        # Generate + send OTP
        otp = generate_otp()
        if send_otp_email(email, otp):
            save_otp(email, otp)
            return jsonify({'message': 'User registered. Please verify OTP'}), 201
        else:
            return jsonify({'error': 'Failed to send OTP'}), 500

    except Exception as e:
        return jsonify({'error': str(e)}), 500

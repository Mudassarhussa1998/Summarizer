from flask import Blueprint, request, jsonify
from models.db import users_collection
import bcrypt

signup_bp = Blueprint('signup_bp', __name__)

@signup_bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        photo = data.get('photo')

        if not all([name, email, password, photo]):
            return jsonify({'error': 'All fields are required'}), 400

        if users_collection.find_one({'email': email}):
            return jsonify({'error': 'Email already registered'}), 409

        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())

        user = {
            'name': name,
            'email': email,
            'password': hashed_password,
            'photo': photo
        }

        users_collection.insert_one(user)
        return jsonify({'message': 'User registered successfully'}), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500

from flask import Blueprint, request, jsonify
from utils.otp_utils import verify_otp
from models.db import users_collection

otp_bp = Blueprint('otp_bp', __name__)

@otp_bp.route('/verify-otp', methods=['POST'])
def verify_user_otp():
    try:
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')

        if not email or not otp:
            return jsonify({'error': 'Email and OTP are required'}), 400

        if verify_otp(email, otp):
            users_collection.update_one(
                {'email': email},
                {'$set': {'verified': True}}
            )
            return jsonify({'message': 'Email verified successfully'}), 200
        else:
            return jsonify({'error': 'Invalid or expired OTP'}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

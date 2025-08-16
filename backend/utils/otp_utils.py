import random
import smtplib
from datetime import datetime, timedelta
from email.mime.text import MIMEText
from models.db import otp_collection
import os

# Email configuration
SMTP_SERVER = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
SMTP_PORT = int(os.getenv('SMTP_PORT', 587))
SMTP_USERNAME = os.getenv('SMTP_USERNAME')
SMTP_PASSWORD = os.getenv('SMTP_PASSWORD')

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices('0123456789', k=6))

def send_otp_email(email, otp):
    """Send OTP via email"""
    try:
        msg = MIMEText(f'Your verification code is: {otp}')
        msg['Subject'] = 'Email Verification Code'
        msg['From'] = SMTP_USERNAME
        msg['To'] = email

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        return True
    except Exception as e:
        print(f"Error sending email: {e}")
        return False

def save_otp(email, otp):
    """Save OTP to MongoDB with expiration"""
    otp_data = {
        'email': email,
        'otp': otp,
        'created_at': datetime.now(),
        'expires_at': datetime.now() + timedelta(minutes=10)
    }
    otp_collection.insert_one(otp_data)

def verify_otp(email, otp):
    """Verify OTP for email"""
    otp_record = otp_collection.find_one({
        'email': email,
        'otp': otp,
        'expires_at': {'$gt': datetime.now()}
    })
    
    if otp_record:
        otp_collection.delete_many({'email': email})
        return True
    return False

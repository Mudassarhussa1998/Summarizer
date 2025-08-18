# Routes package
# This package contains all the route handlers for the Flask application

from .Signup import signup_bp
from .Signin import login_bp
from .Chat import chat_bp
from .Session import session_bp
from .Upload import upload_bp
from .otp import otp_bp
from .url_extraction import url_extraction_bp

__all__ = [
    'signup_bp',
    'login_bp', 
    'chat_bp',
    'session_bp',
    'upload_bp',
    'otp_bp',
    'url_extraction_bp'
]
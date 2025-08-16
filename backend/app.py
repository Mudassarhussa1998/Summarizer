from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Import blueprints
from Signup import signup_bp
from Signin import login_bp
from Session import session_bp
from Chat import chat_bp
from Upload import upload_bp
from otp import otp_bp   # new otp routes

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(signup_bp, url_prefix="/api/auth")
app.register_blueprint(login_bp, url_prefix="/api/auth")
app.register_blueprint(otp_bp, url_prefix="/api/auth")
app.register_blueprint(session_bp, url_prefix='/api/session')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(upload_bp, url_prefix='/api/upload')

if __name__ == '__main__':
    app.run(debug=True, port=5001)

from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv

# Import blueprints
from routes.Signup import signup_bp
from routes.Signin import login_bp
from routes.Upload import upload_bp
from routes.otp import otp_bp   # new otp routes
from routes.url_extraction import url_extraction_bp  # URL data extraction routes
from services.Video_modules.video import video_bp  # Video processing routes

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Register Blueprints
app.register_blueprint(signup_bp, url_prefix="/api/auth")
app.register_blueprint(login_bp, url_prefix="/api/auth")
app.register_blueprint(otp_bp, url_prefix="/api/auth")
app.register_blueprint(upload_bp, url_prefix='/api/upload')
app.register_blueprint(url_extraction_bp, url_prefix='/api/url-extraction')
app.register_blueprint(video_bp, url_prefix='/api/video')  # Video processing endpoints

if __name__ == '__main__':
    app.run(debug=True, port=5002)

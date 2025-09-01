import os
import uuid
import tempfile
import base64
from flask import Blueprint, request, jsonify
from moviepy import VideoFileClip
import whisper
from datetime import datetime
import sys
import jwt

# Add the parent directory to the path to import from models
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
try:
    from models.db import Video_transcriptions_collection
except ImportError as e:
    print(f"Warning: Could not import Video_transcriptions_collection: {e}")
    Video_transcriptions_collection = None

def check_db_connection():
    """Check if database connection is available."""
    try:
        if Video_transcriptions_collection is None:
            return False, "Database collection not available"
        Video_transcriptions_collection.find_one()
        return True, None
    except Exception as e:
        return False, f"Database connection failed: {str(e)}"

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')

def verify_token(token):
    """Verify JWT token and return user data."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def get_user_from_request():
    """Extract user data from request headers."""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    
    token = auth_header.split(' ')[1]
    return verify_token(token)

# Create Blueprint for video processing
video_bp = Blueprint('video', __name__)

# Load Whisper model
model = whisper.load_model("small")

def extract_audio_from_video(video_data):
    """Extract audio from video data without saving to disk."""
    try:
        # Create temporary files
        with tempfile.NamedTemporaryFile(suffix='.mp4', delete=False) as temp_video:
            temp_video.write(video_data)
            temp_video_path = temp_video.name
        
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio:
            temp_audio_path = temp_audio.name
        
        # Extract audio using moviepy
        clip = VideoFileClip(temp_video_path)
        clip.audio.write_audiofile(temp_audio_path, codec="pcm_s16le", logger=None)
        
        # Read audio data
        with open(temp_audio_path, 'rb') as f:
            audio_data = f.read()
        
        # Get video duration
        duration = clip.duration
        
        # Clean up temporary files
        clip.close()
        os.unlink(temp_video_path)
        os.unlink(temp_audio_path)
        
        return audio_data, duration
    except Exception as e:
        # Clean up on error
        if 'temp_video_path' in locals() and os.path.exists(temp_video_path):
            os.unlink(temp_video_path)
        if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)
        raise e

def transcribe_audio_data(audio_data, lang="en"):
    """Transcribe audio data using Whisper."""
    try:
        # Create temporary audio file for Whisper
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_audio:
            temp_audio.write(audio_data)
            temp_audio_path = temp_audio.name
        
        # Transcribe using Whisper
        result = model.transcribe(temp_audio_path, language=lang)
        
        # Clean up temporary file
        os.unlink(temp_audio_path)
        
        return result["text"]
    except Exception as e:
        if 'temp_audio_path' in locals() and os.path.exists(temp_audio_path):
            os.unlink(temp_audio_path)
        raise e

@video_bp.route('/process_video', methods=['POST'])
def process_video():
    """Process video upload and save everything to MongoDB for authenticated user."""
    try:
        # Verify authentication
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({'error': 'Authentication required'}), 401
        
        user_id = user_data.get('user_id')
        if not user_id:
            return jsonify({'error': 'Invalid user data'}), 401
        
        # Check database connection
        db_available, db_error = check_db_connection()
        if not db_available:
            return jsonify({"error": db_error}), 503
            
        if 'video' not in request.files:
            return jsonify({"error": "No video file uploaded"}), 400

        video_file = request.files['video']
        lang = request.form.get("lang", "en")
        processing_id = request.form.get("processing_id", str(uuid.uuid4()))
        
        if video_file.filename == '':
            return jsonify({"error": "No video file selected"}), 400

        # Read video data
        video_data = video_file.read()
        
        # Extract audio and get duration
        audio_data, duration = extract_audio_from_video(video_data)
        
        # Transcribe audio
        transcribed_text = transcribe_audio_data(audio_data, lang)
        
        # Calculate file hash for deduplication
        import hashlib
        file_hash = hashlib.md5(video_data).hexdigest()
        
        # Prepare document for MongoDB (optimized - no video/audio storage)
        doc = {
            "processing_id": processing_id,
            "user_id": user_id,
            "video_filename": video_file.filename,
            "video_size": len(video_data),
            "file_hash": file_hash,
            "language": lang,
            "transcribed_text": transcribed_text,
            "duration": duration,
            "duration_formatted": f"{int(duration//60):02d}:{int(duration%60):02d}",
            "word_count": len(transcribed_text.split()) if transcribed_text else 0,
            "character_count": len(transcribed_text) if transcribed_text else 0,
            "status": "completed",
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "processing_method": "whisper_local",
            "file_hash": hash(video_data)  # Store hash for deduplication
        }
        
        # Insert into MongoDB
        result = Video_transcriptions_collection.insert_one(doc)
        
        # Also store in the new categorical format
        from services.url_modules.database_manager import DatabaseManager
        db_manager = DatabaseManager()
        db_manager.store_video_data_categorical(
            video_title=video_file.filename,
            duration=duration,
            transcript=transcribed_text,
            description="Uploaded video file",
            user_id=user_id,
            source_type='upload',
            source_id=str(result.inserted_id)
        )
        
        return jsonify({
            "message": "Video processed successfully",
            "transcript_id": str(result.inserted_id),
            "video_filename": video_file.filename,
            "duration": duration,
            "duration_formatted": doc["duration_formatted"],
            "transcribed_text": transcribed_text,
            "word_count": doc["word_count"],
            "character_count": doc["character_count"],
            "language": lang
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Processing failed: {str(e)}"}), 500

@video_bp.route('/get_video_transcript/<transcript_id>', methods=['GET'])
def get_video_transcript(transcript_id):
    """Get video transcript by ID (authenticated users only)."""
    try:
        # Authenticate user
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({"error": "Authentication required"}), 401
        
        user_id = user_data.get('user_id')
        
        # Check database connection
        db_available, db_error = check_db_connection()
        if not db_available:
            return jsonify({"error": db_error}), 503
            
        from bson import ObjectId
        
        # Filter by both transcript_id and user_id for privacy
        transcript = Video_transcriptions_collection.find_one({
            "_id": ObjectId(transcript_id),
            "user_id": user_id
        })
        if not transcript:
            return jsonify({"error": "Transcript not found"}), 404
        
        # Convert ObjectId to string for JSON serialization
        transcript["_id"] = str(transcript["_id"])
        
        # Remove large binary data from response (keep metadata only)
        response_data = {
            "_id": transcript["_id"],
            "video_filename": transcript["video_filename"],
            "video_size": transcript["video_size"],
            "language": transcript["language"],
            "transcribed_text": transcript["transcribed_text"],
            "duration": transcript["duration"],
            "duration_formatted": transcript["duration_formatted"],
            "word_count": transcript["word_count"],
            "character_count": transcript["character_count"],
            "status": transcript["status"],
            "created_at": transcript["created_at"],
            "updated_at": transcript["updated_at"],
            "processing_method": transcript["processing_method"]
        }
        
        return jsonify({"transcript": response_data}), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve transcript: {str(e)}"}), 500

@video_bp.route('/get_all_video_transcripts', methods=['GET'])
def get_all_video_transcripts():
    """Get all video transcripts for authenticated user (metadata only)."""
    try:
        # Authenticate user
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({"error": "Authentication required"}), 401
        
        user_id = user_data.get('user_id')
        
        # Check database connection
        db_available, db_error = check_db_connection()
        if not db_available:
            return jsonify({"error": db_error}), 503
            
        # Get user's transcripts but exclude large binary data
        transcripts = list(Video_transcriptions_collection.find(
            {"user_id": user_id}, 
            {
                "video_data": 0,  # Exclude video data
                "audio_data": 0   # Exclude audio data
            }
        ).sort("created_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for transcript in transcripts:
            transcript["_id"] = str(transcript["_id"])
        
        return jsonify({
            "transcripts": transcripts,
            "count": len(transcripts)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Failed to retrieve transcripts: {str(e)}"}), 500

@video_bp.route('/download_video/<transcript_id>', methods=['GET'])
def download_video(transcript_id):
    """Download original video file - Not available (optimization)."""
    try:
        # Check database connection
        db_available, db_error = check_db_connection()
        if not db_available:
            return jsonify({"error": db_error}), 503
            
        from bson import ObjectId
        
        transcript = Video_transcriptions_collection.find_one({"_id": ObjectId(transcript_id)})
        if not transcript:
            return jsonify({"error": "Transcript not found"}), 404
        
        # Video files are no longer stored for performance optimization
        return jsonify({
            "error": "Video download not available",
            "message": "Original video files are not stored for performance optimization. Only transcripts are available.",
            "transcript_id": transcript_id,
            "video_filename": transcript.get("video_filename", "Unknown")
        }), 410  # 410 Gone - resource no longer available
        
    except Exception as e:
        return jsonify({"error": f"Failed to process request: {str(e)}"}), 500

@video_bp.route('/search_video_transcripts', methods=['GET'])
def search_video_transcripts():
    """Search video transcripts by filename or content for authenticated user."""
    try:
        # Authenticate user
        user_data = get_user_from_request()
        if not user_data:
            return jsonify({"error": "Authentication required"}), 401
        
        user_id = user_data.get('user_id')
        
        # Check database connection
        db_available, db_error = check_db_connection()
        if not db_available:
            return jsonify({"error": db_error}), 503
            
        search_term = request.args.get('q', '')
        if not search_term:
            return jsonify({'error': 'Search term is required'}), 400
        
        # Search in video filename and transcribed text, filtered by user_id
        search_query = {
            "user_id": user_id,
            "$or": [
                {"video_filename": {"$regex": search_term, "$options": "i"}},
                {"transcribed_text": {"$regex": search_term, "$options": "i"}}
            ]
        }
        
        results = list(Video_transcriptions_collection.find(
            search_query,
            {
                "video_data": 0,  # Exclude video data
                "audio_data": 0   # Exclude audio data
            }
        ).sort("created_at", -1))
        
        # Convert ObjectId to string for JSON serialization
        for result in results:
            result["_id"] = str(result["_id"])
        
        return jsonify({
            "results": results,
            "count": len(results)
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Search failed: {str(e)}"}), 500
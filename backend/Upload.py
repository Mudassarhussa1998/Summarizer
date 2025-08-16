from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import base64
import os
import mimetypes
from datetime import datetime
import jwt

upload_bp = Blueprint('upload', __name__)

# JWT secret key (should be in environment variables in production)
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key')

# Configuration
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'},
    'video': {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'},
    'text': {'txt', 'md', 'doc', 'docx', 'pdf', 'rtf'},
    'audio': {'mp3', 'wav', 'ogg', 'aac', 'm4a'}
}

def verify_token(token):
    """Verify JWT token and return user data"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

def allowed_file(filename, file_type=None):
    """Check if file extension is allowed"""
    if '.' not in filename:
        return False
    
    extension = filename.rsplit('.', 1)[1].lower()
    
    if file_type:
        return extension in ALLOWED_EXTENSIONS.get(file_type, set())
    
    # Check if extension is in any category
    for extensions in ALLOWED_EXTENSIONS.values():
        if extension in extensions:
            return True
    return False

def get_file_type(filename):
    """Determine file type based on extension"""
    if '.' not in filename:
        return 'unknown'
    
    extension = filename.rsplit('.', 1)[1].lower()
    
    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if extension in extensions:
            return file_type
    
    return 'unknown'

def validate_file_size(file_data):
    """Validate file size from base64 data"""
    try:
        # Calculate size from base64 data
        # Base64 encoding increases size by ~33%, so we decode to get actual size
        if file_data.startswith('data:'):
            # Remove data URL prefix
            file_data = file_data.split(',')[1]
        
        decoded_data = base64.b64decode(file_data)
        return len(decoded_data) <= MAX_FILE_SIZE
    except:
        return False

@upload_bp.route('/upload-file', methods=['POST'])
def upload_file():
    """Handle file upload and return base64 encoded data"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = verify_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Secure the filename
        filename = secure_filename(file.filename)
        
        # Check if file type is allowed
        if not allowed_file(filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Read file data
        file_data = file.read()
        
        # Check file size
        if len(file_data) > MAX_FILE_SIZE:
            return jsonify({'error': f'File size exceeds maximum limit of {MAX_FILE_SIZE // (1024*1024)}MB'}), 400
        
        # Get file type and MIME type
        file_type = get_file_type(filename)
        mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        # Convert to base64
        base64_data = base64.b64encode(file_data).decode('utf-8')
        
        # Create data URL
        data_url = f"data:{mime_type};base64,{base64_data}"
        
        return jsonify({
            'success': True,
            'file': {
                'name': filename,
                'type': file_type,
                'mime_type': mime_type,
                'size': len(file_data),
                'data': data_url,
                'uploaded_at': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/upload-base64', methods=['POST'])
def upload_base64():
    """Handle base64 file upload (for drag & drop or paste functionality)"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = verify_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        data = request.get_json()
        file_data = data.get('file_data')
        filename = data.get('filename')
        
        if not file_data or not filename:
            return jsonify({'error': 'File data and filename are required'}), 400
        
        # Secure the filename
        filename = secure_filename(filename)
        
        # Check if file type is allowed
        if not allowed_file(filename):
            return jsonify({'error': 'File type not allowed'}), 400
        
        # Validate file size
        if not validate_file_size(file_data):
            return jsonify({'error': f'File size exceeds maximum limit of {MAX_FILE_SIZE // (1024*1024)}MB'}), 400
        
        # Get file type and MIME type
        file_type = get_file_type(filename)
        mime_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'
        
        # Ensure data URL format
        if not file_data.startswith('data:'):
            file_data = f"data:{mime_type};base64,{file_data}"
        
        # Calculate actual file size
        base64_part = file_data.split(',')[1] if ',' in file_data else file_data
        actual_size = len(base64.b64decode(base64_part))
        
        return jsonify({
            'success': True,
            'file': {
                'name': filename,
                'type': file_type,
                'mime_type': mime_type,
                'size': actual_size,
                'data': file_data,
                'uploaded_at': datetime.now().isoformat()
            }
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/validate-file', methods=['POST'])
def validate_file_endpoint():
    """Validate file without uploading"""
    try:
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Authorization token required'}), 401
        
        token = auth_header.split(' ')[1]
        user_data = verify_token(token)
        
        if not user_data:
            return jsonify({'error': 'Invalid or expired token'}), 401
        
        data = request.get_json()
        filename = data.get('filename')
        file_size = data.get('file_size', 0)
        
        if not filename:
            return jsonify({'error': 'Filename is required'}), 400
        
        # Secure the filename
        filename = secure_filename(filename)
        
        # Check if file type is allowed
        if not allowed_file(filename):
            return jsonify({
                'valid': False,
                'error': 'File type not allowed',
                'allowed_types': list(ALLOWED_EXTENSIONS.keys())
            }), 200
        
        # Check file size
        if file_size > MAX_FILE_SIZE:
            return jsonify({
                'valid': False,
                'error': f'File size exceeds maximum limit of {MAX_FILE_SIZE // (1024*1024)}MB'
            }), 200
        
        file_type = get_file_type(filename)
        
        return jsonify({
            'valid': True,
            'file_type': file_type,
            'max_size': MAX_FILE_SIZE,
            'allowed_extensions': ALLOWED_EXTENSIONS[file_type] if file_type in ALLOWED_EXTENSIONS else []
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@upload_bp.route('/supported-formats', methods=['GET'])
def get_supported_formats():
    """Get list of supported file formats"""
    return jsonify({
        'success': True,
        'formats': ALLOWED_EXTENSIONS,
        'max_file_size': MAX_FILE_SIZE,
        'max_file_size_mb': MAX_FILE_SIZE // (1024 * 1024)
    }), 200
from flask import Flask
from Signup import signup_bp
from Signin import login_bp
from Session import session_bp
from Chat import chat_bp
from Upload import upload_bp
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

# Register Blueprints
app.register_blueprint(signup_bp)
app.register_blueprint(login_bp)
app.register_blueprint(session_bp, url_prefix='/api/session')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(upload_bp, url_prefix='/api/upload')

if __name__ == '__main__':
    app.run(debug=True)

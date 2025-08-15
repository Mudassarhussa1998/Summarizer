from flask import Flask
from Signup import signup_bp
from Signin import login_bp
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

# Register Blueprints
app.register_blueprint(signup_bp)
app.register_blueprint(login_bp)

if __name__ == '__main__':
    app.run(debug=True)

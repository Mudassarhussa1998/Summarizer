# AI Summarizer Project

A full-stack web application that provides AI-powered content summarization from videos and URLs, built with React TypeScript frontend, Flask backend, and MongoDB database.

## Features
- **User Authentication**: Secure JWT-based login/signup system
- **Video Summarization**: Extract and summarize content from YouTube videos
- **URL Content Extraction**: Summarize articles and web content from URLs
- **Chat Interface**: Interactive chat for content discussion and Q&A
- **History Tracking**: Personal history of all summarized content
- **Session Management**: Persistent user sessions with secure token handling
- **File Upload**: Support for document and media file processing
- **Responsive UI**: Modern dark/light theme support

## Tech Stack
- **Frontend**: React 19 with TypeScript, React Router, Axios
- **Backend**: Flask (Python) with JWT authentication
- **Database**: MongoDB for data persistence
- **AI/ML**: Speech recognition, video processing, content extraction
- **Media Processing**: FFmpeg, PyDub for audio/video handling

## Project Structure
```
Summarizer/
├── frontend/          # React TypeScript app
├── backend/           # Flask API
├── requirements.txt   # Python dependencies
└── README.md
```

## Setup Instructions

### Option 1: Using Docker (Recommended)

The easiest way to run the application is using Docker, which handles all dependencies and setup automatically.

#### Prerequisites
1. **Docker** - Install from [https://docs.docker.com/get-docker/](https://docs.docker.com/get-docker/)
2. **Docker Compose** - Usually included with Docker Desktop

#### Running with Docker
1. Clone this repository
2. From the project root, run:
   ```bash
   docker-compose up -d
   ```
3. Access the application at http://localhost:3000

For more detailed Docker instructions, see [DOCKER_README.md](DOCKER_README.md)

### Option 2: Manual Setup

#### Prerequisites
1. **Python 3.7+** - Make sure Python is installed
2. **Node.js 16+** - Required for React 19 frontend
3. **MongoDB** - Database server
   - Install MongoDB: `brew install mongodb/brew/mongodb-community`
   - Start MongoDB: `brew services start mongodb/brew/mongodb-community`
   - MongoDB will run on default port 27017
4. **FFmpeg** - Required for video/audio processing
   - Install FFmpeg: `brew install ffmpeg`
5. **PyAudio** - For speech recognition (may require additional setup)
   - macOS: `brew install portaudio` then `pip install pyaudio`

#### Environment Setup
1. Create a `.env` file in the `backend/` directory with:
   ```
   JWT_SECRET=your-secret-key-here
   MONGODB_URI=mongodb://localhost:27017/summarizer_db
   ```

### Quick Start
1. Clone or download the project
2. Make the startup script executable: `chmod +x start.sh`
3. Run the startup script: `./start.sh`
4. Open your browser to `http://localhost:3000`

### Manual Setup

#### Backend Setup
1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
2. Start the Flask server:
   ```bash
   cd backend
   python app.py
   ```
   - Backend will run on `http://localhost:5001`

#### Frontend Setup
1. Install Node.js dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Start the React development server:
   ```bash
   npm start
   ```
   - Frontend will run on `http://localhost:3000`

### Database Setup
1. Make sure MongoDB is installed and running on port 27017
2. The application will automatically create a database called `summarizer_db`
3. Collections will be created automatically:
   - `users` - User authentication data
   - `sessions` - User session management
   - `history` - Content summarization history
   - `chats` - Chat conversations

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration

### Content Processing
- `POST /api/url-extraction/extract` - Extract and summarize URL content
- `POST /api/upload` - Upload and process files

### User Data
- `GET /api/session/sessions` - Get user sessions
- `GET /api/history/get-all-history` - Get user's content history
- `GET /api/history/get-history-stats` - Get history statistics
- `DELETE /api/history/delete/{id}` - Delete history item

### Chat
- `POST /api/chat/send-message` - Send chat message
- `GET /api/chat/get-messages` - Get chat history

## Running in Any IDE (PyCharm, VS Code, etc.)

### Backend (Flask)
- Ensure your Python interpreter is set to Python 3.7+
- Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
- Set up environment variables in `backend/.env`
- Run the backend server:
   ```bash
   python backend/app.py
   ```
- The backend will be available at `http://localhost:5001`

### Frontend (React)
- Open a terminal in the `frontend` directory
- Install dependencies:
   ```bash
   npm install
   ```
- Start the React development server:
   ```bash
   npm start
   ```
- The frontend will be available at `http://localhost:3000`

### MongoDB
- Make sure MongoDB is running on port 27017
- No manual database setup required - collections are created automatically

## Usage

1. **Sign Up/Login**: Create an account or login with existing credentials
2. **Summarize Content**: 
   - Paste a YouTube URL or article URL to get AI-powered summaries
   - Upload documents for processing
3. **Chat**: Use the chat interface to ask questions about summarized content
4. **History**: View and manage your summarization history
5. **Sessions**: Track your usage sessions and activity

## Troubleshooting

### Common Issues
- **PyAudio installation fails**: Install portaudio first with `brew install portaudio`
- **FFmpeg not found**: Install with `brew install ffmpeg`
- **MongoDB connection error**: Ensure MongoDB is running with `brew services start mongodb/brew/mongodb-community`
- **JWT authentication errors**: Check that JWT_SECRET is set in backend/.env
- **Port conflicts**: Make sure ports 3000 (frontend) and 5001 (backend) are available
# Summarizer Project

A full-stack web application built with React TypeScript frontend, Flask backend, and MongoDB database.

## Features
- User registration with name, email, password, class, section, and photo
- Display user information on a separate page
- MongoDB for data persistence

## Tech Stack
- Frontend: React with TypeScript
- Backend: Flask (Python)
- Database: MongoDB

## Project Structure
```
Summarizer/
├── frontend/          # React TypeScript app
├── backend/           # Flask API
├── requirements.txt   # Python dependencies
└── README.md
```

## Setup Instructions

### Prerequisites
1. **Python 3.7+** - Make sure Python is installed
2. **Node.js 14+** - Required for React frontend
3. **MongoDB** - Database server
   - Install MongoDB: `brew install mongodb/brew/mongodb-community`
   - Start MongoDB: `brew services start mongodb/brew/mongodb-community`
   - MongoDB will run on default port 27017

### Quick Start
1. Clone or download the project
2. Run the startup script: `./start.sh`
3. Open your browser to `http://localhost:3000`

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
3. User data will be stored in the `users` collection
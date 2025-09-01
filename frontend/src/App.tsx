import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, AuthProvider, UrlExtractionProvider, VideoProcessingProvider, useTheme } from './contexts';
import SignUpForm from './components/Signup/SignUpForm';
import LoginForm from './components/Login/LoginForm';
import WelcomePage from './components/WelcomePage/WelcomePage';
import { YouTubePage } from './components/YouTube';
import { VideoUpload } from './components/VideoUpload';
import { ProcessingIndicator } from './components/ProcessingIndicator';
import UrlExtractionIndicator from './components/UrlExtractionIndicator';
import CategoricalVideos from './pages/CategoricalVideos';
import CategoricalVideoDetail from './pages/CategoricalVideoDetail';
// import { SnackbarProvider } from 'notistack';
import './App.css';
import Header from './components/Header/header';
import Dashboard from './components/Dashboard/Dashboard';

const AppContent = () => {
  const { theme } = useTheme();

  return (
    <div className={`App ${theme}`}>
      <Header />
      <ProcessingIndicator />
      <UrlExtractionIndicator />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignUpForm />} />
          <Route path="/youtube" element={<YouTubePage />} />
          <Route path="/video-upload" element={<VideoUpload />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/categorical-videos" element={<CategoricalVideos />} />
          <Route path="/categorical-video/:videoId" element={<CategoricalVideoDetail />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UrlExtractionProvider>
          <VideoProcessingProvider>
            <Router>
              <AppContent />
            </Router>
          </VideoProcessingProvider>
        </UrlExtractionProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

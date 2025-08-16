import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, AuthProvider, useTheme } from './contexts';
import SignUpForm from './components/Signup/SignUpForm';
import LoginForm from './components/Login/LoginForm';
import WelcomePage from './components/WelcomePage/WelcomePage';
import './App.css';
import Header from './components/Header/header';

const AppContent = () => {
  const { theme } = useTheme();

  return (
    <div className={`App ${theme}`}>
      <Header />
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignUpForm />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

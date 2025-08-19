import React from 'react'
import { useAuth, useTheme } from '../../contexts';
import { Link, useNavigate } from 'react-router-dom';

export default function Header() {

    const { theme, toggleTheme } = useTheme();
    const { user, isAuthenticated, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
      logout();
      navigate('/login');
    };
  return (
    <nav className="navbar">
      <div className="nav-container">
        <h1 className="nav-title">Summarizer</h1>
        <div className="nav-links">
          {!isAuthenticated ? (
            <>
              <Link to="/login" className="nav-link">Login</Link>
              <Link to="/signup" className="nav-link">Sign Up</Link>            
            </>
          ) : (
            <>
              <Link to="/chat" className="nav-link">Chat</Link>
              <Link to="/youtube" className="nav-link">YouTube</Link>
              <Link to="/video-upload" className="nav-link">Video Upload</Link>
              <Link to="/history" className="nav-link">History</Link>
              <div className="user-profile">
                {user?.photo && (
                  <img 
                    src={user.photo} 
                    alt={user.name} 
                    className="user-avatar"
                  />
                )}
                <span className="user-info">Welcome, {user?.name}!</span>
              </div>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </>
          )}
          <div className="theme-toggle-container" onClick={toggleTheme} aria-label="Toggle theme">
            <div className={`theme-toggle-track ${theme}`}>
              <div className="theme-toggle-thumb">
                {theme === 'light' ? (
                  <svg className="theme-icon sun-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="5" fill="#FFD700"/>
                    <path d="m12 1 0 2" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                    <path d="m12 21 0 2" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                    <path d="m22 12 -2 0" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                    <path d="m4 12 -2 0" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                    <path d="m19.07 4.93 -1.41 1.41" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                    <path d="m6.34 17.66 -1.41 1.41" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                    <path d="m19.07 19.07 -1.41 -1.41" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                    <path d="m6.34 6.34 -1.41 -1.41" stroke="#FFD700" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg className="theme-icon moon-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="#E6E6FA"/>
                  </svg>
                )}
              </div>
              <div className="theme-toggle-bg-elements">
                {theme === 'light' ? (
                  <>
                    <svg className="cloud cloud-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="white"/>
                    </svg>
                    <svg className="cloud cloud-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" fill="white"/>
                    </svg>
                  </>
                ) : (
                  <>
                    <div className="star star-1"></div>
                    <div className="star star-2"></div>
                    <div className="star star-3"></div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}

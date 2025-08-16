import React from 'react'
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts';
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
          <button onClick={toggleTheme} className="theme-toggle">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </div>
    </nav>
  )
}

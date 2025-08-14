import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import RegisterForm from './components/RegisterForm';
import UsersList from './components/UsersList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">Summarizer</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">Register</Link>
              <Link to="/users" className="nav-link">View Users</Link>
            </div>
          </div>
        </nav>
        
        <main className="main-content">
          <Routes>
            <Route path="/" element={<RegisterForm />} />
            <Route path="/users" element={<UsersList />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

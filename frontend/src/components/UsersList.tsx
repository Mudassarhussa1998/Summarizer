import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './UsersList.css';

interface User {
  _id: string;
  name: string;
  email: string;
  class: string;
  section: string;
  photo?: string;
  created_at: string;
}

const UsersList: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5001/api/users');
      setUsers(response.data.users);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="users-container">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="users-container">
        <div className="error-message">{error}</div>
        <button onClick={fetchUsers} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>Registered Users</h2>
        <button onClick={fetchUsers} className="refresh-btn">Refresh</button>
      </div>
      
      {users.length === 0 ? (
        <div className="no-users">
          <p>No users registered yet.</p>
        </div>
      ) : (
        <div className="users-grid">
          {users.map((user) => (
            <div key={user._id} className="user-card">
              <div className="user-photo">
                {user.photo ? (
                  <img src={user.photo} alt={user.name} className="photo" />
                ) : (
                  <div className="no-photo">
                    <span>{user.name.charAt(0).toUpperCase()}</span>
                  </div>
                )}
              </div>
              
              <div className="user-info">
                <h3 className="user-name">{user.name}</h3>
                <p className="user-email">{user.email}</p>
                
                <div className="user-details">
                  <div className="detail-item">
                    <span className="label">Class:</span>
                    <span className="value">{user.class}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Section:</span>
                    <span className="value">{user.section}</span>
                  </div>
                  <div className="detail-item">
                    <span className="label">Registered:</span>
                    <span className="value">{formatDate(user.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="users-count">
        Total Users: {users.length}
      </div>
    </div>
  );
};

export default UsersList;
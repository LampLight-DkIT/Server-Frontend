import React from 'react';
import './Dashboard.css';

function Dashboard({ user, onLogout }) {
  // Format date helper function
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <div className="nav-brand">MyApp</div>
        <div className="nav-user">
          <span>Welcome, {user?.username || 'User'}</span>
          <button onClick={onLogout} className="logout-btn">Logout</button>
        </div>
      </nav>
      
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome to Your Dashboard</h1>
          <p>You're successfully logged in!</p>
        </div>
        
        <div className="user-info">
          <h2>Your Profile</h2>
          <div className="info-card">
            <div className="info-item">
              <label>Username:</label>
              <span>{user?.username || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{user?.email || 'N/A'}</span>
            </div>
            <div className="info-item">
              <label>Account Created:</label>
              <span>{formatDate(user?.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard; 
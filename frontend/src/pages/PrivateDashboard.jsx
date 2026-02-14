import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

function PrivateDashboard({ onLogout }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await api.get('/me');
        setUser(response.data);
      } catch {
        setError('Failed to load user data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    onLogout();
    navigate('/login');
  };

  if (loading) {
    return <section className="page-shell"><p className="muted">Loading...</p></section>;
  }

  if (error) {
    return <section className="page-shell"><p className="error-text">{error}</p></section>;
  }

  return (
    <section className="page-shell auth-shell" style={{ maxWidth: '760px' }}>
      <div className="surface-card panel-lg">
        <h1 className="page-title">Gold Rush Dashboard</h1>
        <p className="page-subtitle">Private account overview and quick actions.</p>

        {user && (
          <div className="surface-card panel" style={{ background: 'var(--surface-soft)' }}>
            <h2>Welcome!</h2>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>User ID:</strong> {user.id}</p>
            <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
            <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        )}

        <div className="btn-row" style={{ marginTop: '1rem' }}>
          <Link to="/" className="btn btn-secondary">Go to Public Home</Link>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </div>
      </div>
    </section>
  );
}

export default PrivateDashboard;
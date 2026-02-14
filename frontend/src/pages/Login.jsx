import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Login({ onAuthSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/login', { email, password });
      if (!response.data?.token) {
        throw new Error('Missing token in login response');
      }

      onAuthSuccess(response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell auth-shell">
      <div className="surface-card panel-lg">
        <h1 className="page-title">Welcome back</h1>
        <p className="page-subtitle">Sign in to access your dashboard.</p>
        
        <form onSubmit={handleSubmit} className="form-stack">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="field"
          />
          
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="field"
          />
          
          {error && <p className="error-text">{error}</p>}
          
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        
        <p className="muted">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </section>
 );
}

export default Login;

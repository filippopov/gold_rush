import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';

function Register({ onAuthSuccess }) {
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
      const response = await api.post('/register', { email, password });
      if (!response.data?.token) {
        throw new Error('Missing token in register response');
      }

      onAuthSuccess(response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page-shell auth-shell">
      <div className="surface-card panel-lg">
        <h1 className="page-title">Create your account</h1>
        <p className="page-subtitle">Join Gold Rush to unlock your private dashboard.</p>
        
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
            minLength="6"
            className="field"
          />
          
          {error && <p className="error-text">{error}</p>}
          
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating account...' : 'Register'}
          </button>
        </form>
        
        <p className="muted">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </section>
  );
}

export default Register;

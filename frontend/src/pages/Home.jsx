import React from 'react';
import { Link } from 'react-router-dom';
import MetalsTracker from '../components/MetalsTracker';

function Home({ isAuthenticated }) {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>🥇 Gold Rush</h1>
        <p style={styles.subtitle}>Public precious metals prices and history</p>

        <div style={styles.actions}>
          {!isAuthenticated && (
            <>
              <Link to="/login" style={styles.linkButton}>Login</Link>
              <Link to="/register" style={styles.linkButtonSecondary}>Register</Link>
            </>
          )}

          {isAuthenticated && (
            <Link to="/dashboard" style={styles.linkButton}>Open Dashboard</Link>
          )}
        </div>

        <MetalsTracker />
      </div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    fontFamily: 'sans-serif',
    padding: '1rem',
  },
  card: {
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '8px',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '760px',
  },
  title: {
    textAlign: 'center',
    marginBottom: '0.5rem',
    color: '#333',
  },
  subtitle: {
    textAlign: 'center',
    marginTop: 0,
    marginBottom: '1rem',
    color: '#666',
  },
  actions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  linkButton: {
    backgroundColor: '#1f6feb',
    color: '#fff',
    textDecoration: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.92rem',
  },
  linkButtonSecondary: {
    backgroundColor: '#f1f1f1',
    color: '#333',
    textDecoration: 'none',
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.92rem',
  },
};

export default Home;
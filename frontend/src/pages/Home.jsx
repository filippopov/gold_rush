import React from 'react';
import { Link } from 'react-router-dom';
import MetalsTracker from '../components/MetalsTracker';

function Home({ isAuthenticated }) {
  return (
    <section className="page-shell">
      <header className="page-hero">
        <h1 className="page-title">Gold Rush</h1>
        <p className="page-subtitle">Public precious metals prices and history</p>
      </header>

      <div className="surface-card panel-lg">
        <div className="btn-row">
          {!isAuthenticated && (
            <>
              <Link to="/login" className="btn btn-primary">Login</Link>
              <Link to="/register" className="btn btn-secondary">Register</Link>
            </>
          )}

          {isAuthenticated && (
            <Link to="/dashboard" className="btn btn-primary">Open Dashboard</Link>
          )}
        </div>

        <MetalsTracker />
      </div>
    </section>
  );
}

export default Home;
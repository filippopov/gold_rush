import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';

function Navbar({ isAuthenticated, onLogout }) {
  const navigate = useNavigate();

  const handleLogoutClick = () => {
    onLogout();
    navigate('/login');
  };

  return (
    <header className="site-header">
      <div className="shell nav-shell">
        <Link to="/" className="brand-link" aria-label="Gold Rush Home">
          <span className="brand-icon" aria-hidden="true">🥇</span>
          <span className="brand-text">Gold Rush</span>
        </Link>

        <nav className="main-nav" aria-label="Main navigation">
          <NavLink
            to="/"
            className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
          >
            Home
          </NavLink>

          {!isAuthenticated && (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              >
                Register
              </NavLink>
            </>
          )}

          {isAuthenticated && (
            <>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => `nav-link${isActive ? ' is-active' : ''}`}
              >
                Dashboard
              </NavLink>
              <button type="button" className="nav-link nav-button" onClick={handleLogoutClick}>
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import PrivateDashboard from './pages/PrivateDashboard';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

function App() {
  const [token, setToken] = React.useState(() => localStorage.getItem('token'));

  const handleAuthSuccess = React.useCallback((jwtToken) => {
    localStorage.setItem('token', jwtToken);
    setToken(jwtToken);
  }, []);

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
  }, []);

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="app-shell">
        <Navbar isAuthenticated={Boolean(token)} onLogout={handleLogout} />

        <main className="main-content">
          <div className="shell">
            <Routes>
              <Route path="/" element={<Home isAuthenticated={Boolean(token)} />} />
              <Route path="/home" element={<Home isAuthenticated={Boolean(token)} />} />
              <Route path="/login" element={<Login onAuthSuccess={handleAuthSuccess} />} />
              <Route path="/register" element={<Register onAuthSuccess={handleAuthSuccess} />} />
              <Route 
                path="/dashboard" 
                element={token ? <PrivateDashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;

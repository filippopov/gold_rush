import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

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
      <Routes>
        <Route path="/login" element={<Login onAuthSuccess={handleAuthSuccess} />} />
        <Route path="/register" element={<Register onAuthSuccess={handleAuthSuccess} />} />
        <Route 
          path="/dashboard" 
          element={token ? <Dashboard onLogout={handleLogout} /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/" 
          element={<Navigate to={token ? "/dashboard" : "/login"} replace />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

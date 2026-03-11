import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">🤖 AI Resume Matcher</Link>
      </div>
      <div className="navbar-links">
        {!user ? (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register" className="btn-primary">Register</Link>
          </>
        ) : (
          <>
            {user.role === 'candidate' ? (
              <>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/upload">Upload Resume</Link>
                <Link to="/jobs">Jobs</Link>
              </>
            ) : (
              <>
                <Link to="/recruiter">Dashboard</Link>
                <Link to="/post-job">Post Job</Link>
                <Link to="/candidates">Candidates</Link>
              </>
            )}
            <span className="navbar-user">👤 {user.name}</span>
            <button onClick={handleLogout} className="btn-outline">Logout</button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

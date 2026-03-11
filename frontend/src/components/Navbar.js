import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  const linkClass = (path) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-100 text-blue-700'
        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 text-gray-900 font-bold text-lg">
            <span className="text-2xl">🤖</span>
            <span className="hidden sm:block">AI Resume Matcher</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {!user ? (
              <>
                <Link to="/jobs" className={linkClass('/jobs')}>Browse Jobs</Link>
                <div className="w-px h-5 bg-gray-200 mx-2"></div>
                <Link to="/login" className={linkClass('/login')}>Log in</Link>
                <Link
                  to="/register"
                  className="ml-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {user.role === 'candidate' ? (
                  <>
                    <Link to="/dashboard" className={linkClass('/dashboard')}>Dashboard</Link>
                    <Link to="/upload" className={linkClass('/upload')}>Upload Resume</Link>
                    <Link to="/recommendations" className={linkClass('/recommendations')}>Matches</Link>
                    <Link to="/skill-analysis" className={linkClass('/skill-analysis')}>Skills</Link>
                    <Link to="/saved-jobs" className={linkClass('/saved-jobs')}>Discover</Link>
                    <Link to="/jobs" className={linkClass('/jobs')}>Jobs</Link>
                  </>
                ) : (
                  <>
                    <Link to="/recruiter" className={linkClass('/recruiter')}>Dashboard</Link>
                    <Link to="/post-job" className={linkClass('/post-job')}>Post Job</Link>
                    <Link to="/candidates" className={linkClass('/candidates')}>Candidates</Link>
                  </>
                )}
                <div className="w-px h-5 bg-gray-200 mx-2"></div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-sm font-bold">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-700 font-medium hidden lg:block">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="ml-2 px-3 py-2 text-sm text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                  Logout
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 space-y-1">
            {!user ? (
              <>
                <Link to="/jobs" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Browse Jobs</Link>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Log in</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="block px-4 py-2 bg-blue-600 text-white rounded-lg font-medium mx-4 text-center">Get Started</Link>
              </>
            ) : (
              <>
                {user.role === 'candidate' ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Dashboard</Link>
                    <Link to="/upload" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Upload Resume</Link>
                    <Link to="/recommendations" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Matches</Link>
                    <Link to="/skill-analysis" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Skill Analysis</Link>
                    <Link to="/saved-jobs" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Discover Jobs</Link>
                    <Link to="/jobs" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Browse Jobs</Link>
                  </>
                ) : (
                  <>
                    <Link to="/recruiter" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Dashboard</Link>
                    <Link to="/post-job" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Post Job</Link>
                    <Link to="/candidates" onClick={() => setMobileOpen(false)} className="block px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg">Candidates</Link>
                  </>
                )}
                <div className="px-4 py-2 text-sm text-gray-500">Signed in as {user.name}</div>
                <button
                  onClick={() => { setMobileOpen(false); handleLogout(); }}
                  className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;


import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const CandidateDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await api.get('/candidate/profile');
        setProfile(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="loading">Loading your dashboard...</div>;

  return (
    <div className="page-container">
      <div className="dashboard-header">
        <h1>Welcome, {user.name} 👋</h1>
        <p className="page-subtitle">Your AI-powered career assistant</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {!profile?.resume ? (
        <div className="empty-state">
          <div className="empty-icon">📄</div>
          <h2>No Resume Uploaded Yet</h2>
          <p>Upload your resume to get personalised job recommendations and skill gap analysis.</p>
          <Link to="/upload" className="btn-primary">Upload Resume</Link>
        </div>
      ) : (
        <div className="dashboard-grid">
          {/* Resume summary card */}
          <div className="card">
            <h2>📄 Your Resume</h2>
            <p className="muted">File: {profile.resume.fileName}</p>
            <p>{profile.resume.summary || 'No summary available.'}</p>
            <div className="skill-badges mt-1">
              {profile.resume.skills.slice(0, 10).map((s) => (
                <span key={s} className="badge badge-skill">{s}</span>
              ))}
              {profile.resume.skills.length > 10 && (
                <span className="badge badge-more">+{profile.resume.skills.length - 10} more</span>
              )}
            </div>
            <Link to="/upload" className="btn-outline mt-1">Update Resume</Link>
          </div>

          {/* Top matches */}
          <div className="card">
            <h2>🎯 Top Job Matches</h2>
            {profile.topMatches.length === 0 ? (
              <p className="muted">No matches yet. <Link to="/jobs">Browse jobs</Link></p>
            ) : (
              <div className="match-list">
                {profile.topMatches.map((m) => (
                  <div key={m._id} className="match-item">
                    <div className="match-info">
                      <strong>{m.job?.title}</strong>
                      <span className="muted">{m.job?.company}</span>
                    </div>
                    <div className="score-badge" style={{ '--score': m.matchingScore }}>
                      {m.matchingScore}%
                    </div>
                  </div>
                ))}
                <Link to="/jobs" className="btn-outline mt-1">View All Recommendations</Link>
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div className="card stats-card">
            <h2>📊 Quick Stats</h2>
            <div className="stats-grid">
              <div className="stat">
                <span className="stat-value">{profile.resume.skills.length}</span>
                <span className="stat-label">Skills Detected</span>
              </div>
              <div className="stat">
                <span className="stat-value">{profile.topMatches.length}</span>
                <span className="stat-label">Job Matches</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {profile.topMatches.length > 0
                    ? Math.round(profile.topMatches.reduce((a, m) => a + m.matchingScore, 0) / profile.topMatches.length)
                    : 0}%
                </span>
                <span className="stat-label">Avg Match Score</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CandidateDashboard;

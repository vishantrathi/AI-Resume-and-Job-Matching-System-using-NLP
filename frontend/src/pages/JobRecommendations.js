import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

const JobRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState(null);
  const [skillGap, setSkillGap] = useState(null);
  const [gapLoading, setGapLoading] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Trigger matching computation
        await api.post('/jobs/match', {});
        // Fetch recommendations
        const { data } = await api.get('/jobs/recommendations');
        setRecommendations(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };
    fetchRecommendations();
  }, []);

  const handleViewGap = async (jobId) => {
    setSelectedJob(jobId);
    setGapLoading(true);
    setSkillGap(null);
    try {
      const { data } = await api.get(`/candidate/skill-gap/${jobId}`);
      setSkillGap(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load skill gap');
    } finally {
      setGapLoading(false);
    }
  };

  const filtered = recommendations.filter((r) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      r.job?.title?.toLowerCase().includes(q) ||
      r.job?.company?.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="loading">Analysing your resume and computing matches...</div>;

  return (
    <div className="page-container">
      <h1>🎯 Job Recommendations</h1>
      <p className="page-subtitle">Jobs ranked by AI matching score based on your resume</p>

      {error && <div className="alert alert-error">{error}</div>}

      {recommendations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💼</div>
          <h2>No Recommendations Yet</h2>
          <p>Upload your resume to get personalised job matches.</p>
          <Link to="/upload" className="btn-primary">Upload Resume</Link>
        </div>
      ) : (
        <div className="jobs-layout">
          <div className="jobs-panel">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search by title or company..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
            </div>

            <div className="jobs-list">
              {filtered.map(({ match, job }) => (
                <div
                  key={match._id}
                  className={`job-card ${selectedJob === job._id ? 'selected' : ''}`}
                  onClick={() => handleViewGap(job._id)}
                >
                  <div className="job-card-header">
                    <div>
                      <h3>{job?.title}</h3>
                      <p className="company">{job?.company}</p>
                      {job?.location && <p className="location">📍 {job.location}</p>}
                    </div>
                    <div
                      className="score-circle"
                      style={{
                        background: match.matchingScore >= 70
                          ? '#10b981'
                          : match.matchingScore >= 40
                          ? '#f59e0b'
                          : '#ef4444',
                      }}
                    >
                      {match.matchingScore}%
                    </div>
                  </div>
                  <div className="job-skills">
                    {job?.requiredSkills?.slice(0, 5).map((s) => (
                      <span
                        key={s}
                        className={`badge ${match.matchedSkills?.map(x => x.toLowerCase()).includes(s.toLowerCase()) ? 'badge-matched' : 'badge-missing'}`}
                      >
                        {s}
                      </span>
                    ))}
                    {job?.requiredSkills?.length > 5 && (
                      <span className="badge badge-more">+{job.requiredSkills.length - 5}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Skill gap panel */}
          <div className="gap-panel">
            {!selectedJob ? (
              <div className="gap-placeholder">
                <p>👈 Select a job to view skill gap analysis</p>
              </div>
            ) : gapLoading ? (
              <div className="loading">Analysing skill gap...</div>
            ) : skillGap ? (
              <div className="gap-content">
                <h2>Skill Gap Analysis</h2>
                <h3>{skillGap.job?.title} at {skillGap.job?.company}</h3>

                <div className="score-bar-wrap">
                  <div className="score-bar-label">
                    <span>Match Score</span>
                    <strong>{skillGap.matchingScore}%</strong>
                  </div>
                  <div className="score-bar">
                    <div
                      className="score-bar-fill"
                      style={{
                        width: `${skillGap.matchingScore}%`,
                        background: skillGap.matchingScore >= 70 ? '#10b981' : skillGap.matchingScore >= 40 ? '#f59e0b' : '#ef4444',
                      }}
                    />
                  </div>
                </div>

                <div className="gap-section">
                  <h4>✅ Matched Skills ({skillGap.matchedSkills.length})</h4>
                  <div className="skill-badges">
                    {skillGap.matchedSkills.length > 0
                      ? skillGap.matchedSkills.map((s) => <span key={s} className="badge badge-matched">{s}</span>)
                      : <span className="muted">None</span>}
                  </div>
                </div>

                <div className="gap-section">
                  <h4>❌ Missing Skills ({skillGap.missingSkills.length})</h4>
                  <div className="skill-badges">
                    {skillGap.missingSkills.length > 0
                      ? skillGap.missingSkills.map((s) => <span key={s} className="badge badge-missing">{s}</span>)
                      : <span className="muted">None — great fit!</span>}
                  </div>
                </div>

                {skillGap.missingSkills.length > 0 && (
                  <div className="gap-tip">
                    💡 Consider learning <strong>{skillGap.missingSkills.slice(0, 2).join(', ')}</strong> to improve your match score.
                  </div>
                )}

                {skillGap.job && (
                  <a
                    href={`/jobs/${selectedJob}`}
                    className="btn-primary mt-1"
                    rel="noopener noreferrer"
                  >
                    View Full Job Description
                  </a>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobRecommendations;

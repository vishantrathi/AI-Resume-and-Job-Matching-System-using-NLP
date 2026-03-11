import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div className="home-container">
      <section className="hero">
        <h1>AI-Powered Resume &amp; Job Matching</h1>
        <p className="hero-subtitle">
          Upload your resume and let our AI instantly match you with the right jobs using
          Natural Language Processing and semantic analysis.
        </p>
        {!user ? (
          <div className="hero-cta">
            <Link to="/register" className="btn-primary btn-large">Get Started Free</Link>
            <Link to="/login" className="btn-outline btn-large">Sign In</Link>
          </div>
        ) : user.role === 'candidate' ? (
          <div className="hero-cta">
            <Link to="/upload" className="btn-primary btn-large">Upload Resume</Link>
            <Link to="/jobs" className="btn-outline btn-large">Browse Jobs</Link>
          </div>
        ) : (
          <div className="hero-cta">
            <Link to="/post-job" className="btn-primary btn-large">Post a Job</Link>
            <Link to="/recruiter" className="btn-outline btn-large">View Dashboard</Link>
          </div>
        )}
      </section>

      <section className="features">
        <h2>How It Works</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📄</div>
            <h3>Upload Resume</h3>
            <p>Upload your resume in PDF or DOCX format. Our parser extracts skills, experience, and education automatically.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>AI Analysis</h3>
            <p>Our NLP engine identifies technical skills and uses semantic matching to understand your profile in depth.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Job Matching</h3>
            <p>Get ranked job recommendations with matching scores so you apply to the most relevant positions first.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Skill Gap Analysis</h3>
            <p>See exactly which skills you need to learn to qualify for your target job role.</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

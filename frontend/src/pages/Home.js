import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  const features = [
    {
      icon: '📄',
      title: 'Resume Parsing',
      description: 'Upload PDF or DOCX. Our NLP engine extracts skills, experience, education and projects automatically.',
    },
    {
      icon: '🧠',
      title: 'AI Skill Extraction',
      description: 'Identifies 150+ technical skills, frameworks, tools and programming languages from your resume.',
    },
    {
      icon: '🎯',
      title: 'Semantic Job Matching',
      description: 'Cosine similarity scoring ranks jobs by relevance — not just keyword overlap — for better matches.',
    },
    {
      icon: '📊',
      title: 'Skill Gap Analysis',
      description: 'See exactly which skills you need to learn to qualify for your target role.',
    },
    {
      icon: '🌐',
      title: 'Real-Time Job Discovery',
      description: 'When no local jobs match, automatically discover jobs from RemoteOK and other sources.',
    },
    {
      icon: '🔒',
      title: 'Secure & Private',
      description: 'JWT authentication, rate limiting, and secure file upload protect your data.',
    },
  ];

  const stats = [
    { value: '150+', label: 'Skills Recognized' },
    { value: 'AI', label: 'Semantic Matching' },
    { value: 'PDF/DOCX', label: 'Resume Formats' },
    { value: 'Real-time', label: 'Job Discovery' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6 border border-blue-100">
            <span>✨</span> Powered by NLP &amp; Semantic AI
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
            Match Your Resume to
            <br />
            <span className="text-blue-600">the Perfect Job</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Upload your resume and let our AI instantly match you with relevant jobs using
            Natural Language Processing and semantic similarity scoring.
          </p>

          {!user ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Get Started Free →
              </Link>
              <Link
                to="/jobs"
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                Browse Jobs
              </Link>
            </div>
          ) : user.role === 'candidate' ? (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/upload"
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Upload Resume →
              </Link>
              <Link
                to="/recommendations"
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                View Matches
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/post-job"
                className="px-8 py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Post a Job →
              </Link>
              <Link
                to="/recruiter"
                className="px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold text-lg hover:bg-gray-50 transition-colors border border-gray-200"
              >
                View Dashboard
              </Link>
            </div>
          )}

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-16 pt-10 border-t border-gray-100">
            {stats.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How It Works</h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            A complete AI-powered pipeline from resume parsing to job discovery
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Job Discovery Pipeline */}
      <section className="bg-white border-t border-b border-gray-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Job Discovery Pipeline</h2>
            <p className="text-lg text-gray-500">Intelligent fallback when no local jobs match your profile</p>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-4 max-w-4xl mx-auto">
            {[
              { step: '1', label: 'Upload Resume', icon: '📄' },
              { step: '2', label: 'Parse & Extract Skills', icon: '🧠' },
              { step: '3', label: 'Search DB Jobs', icon: '🔍' },
              { step: '4', label: 'Discover from Web', icon: '🌐' },
              { step: '5', label: 'Rank by Similarity', icon: '🎯' },
            ].map((item, i, arr) => (
              <React.Fragment key={i}>
                <div className="flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-blue-50 border-2 border-blue-200 rounded-2xl flex items-center justify-center text-2xl mb-2">
                    {item.icon}
                  </div>
                  <div className="text-xs font-semibold text-blue-600 mb-0.5">Step {item.step}</div>
                  <div className="text-sm font-medium text-gray-700 max-w-[100px]">{item.label}</div>
                </div>
                {i < arr.length - 1 && (
                  <div className="hidden md:block text-gray-300 text-2xl">→</div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <div className="bg-blue-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Find Your Perfect Job?</h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of candidates who use AI-powered matching to land their dream job faster.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="px-8 py-4 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-colors"
              >
                Create Free Account →
              </Link>
              <Link
                to="/login"
                className="px-8 py-4 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 transition-colors border border-blue-500"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;

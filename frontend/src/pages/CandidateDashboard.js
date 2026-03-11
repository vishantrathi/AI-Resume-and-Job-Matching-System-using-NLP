import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import api from '../api';

function scoreColor(score) {
  if (score >= 70) return '#10b981';
  if (score >= 40) return '#f59e0b';
  return '#ef4444';
}

const CandidateDashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/candidate/profile')
      .then(({ data }) => setProfile(data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-3"
          />
          <p className="text-gray-500 text-sm">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  const skills = profile?.resume?.skills || [];
  const topMatches = profile?.topMatches || [];
  const bestScore = topMatches.length > 0 ? Math.max(...topMatches.map((m) => m.matchingScore)) : 0;
  const avgScore = topMatches.length > 0
    ? Math.round(topMatches.reduce((s, m) => s + m.matchingScore, 0) / topMatches.length)
    : 0;

  // Radar data: top 6 skills
  const radarData = skills.slice(0, 6).map((skill, i) => {
    const matchCount = topMatches.filter((m) =>
      m.matchedSkills?.some((s) => s.toLowerCase() === skill.toLowerCase()),
    ).length;
    return {
      skill: skill.length > 10 ? skill.substring(0, 10) + '…' : skill,
      value: matchCount,
      fullMark: Math.max(topMatches.length, 1),
    };
  });

  // Bar chart: match scores per job
  const barData = topMatches.map((m) => ({
    name: (m.job?.title || 'Job').substring(0, 14),
    score: m.matchingScore,
  }));

  const barColors = ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">

        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 mt-1">Your AI-powered career assistant</p>
        </motion.div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {!profile?.resume ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm"
          >
            <div className="text-6xl mb-4">📄</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">No Resume Uploaded Yet</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Upload your resume to unlock AI-powered job recommendations and skill analysis.
            </p>
            <Link
              to="/upload"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Upload Resume
            </Link>
          </motion.div>
        ) : (
          <>
            {/* Resume Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: 'Skills Detected', value: skills.length, icon: '🎯', color: 'blue' },
                { label: 'Job Matches', value: topMatches.length, icon: '💼', color: 'purple' },
                { label: 'Best Match', value: `${bestScore}%`, icon: '🏆', color: 'green' },
                { label: 'Avg Match', value: `${avgScore}%`, icon: '📊', color: 'amber' },
              ].map(({ label, value, icon, color }, i) => (
                <motion.div
                  key={label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white rounded-2xl border border-gray-200 p-4 text-center shadow-sm"
                >
                  <div className="text-2xl mb-1">{icon}</div>
                  <div className={`text-2xl font-bold text-${color}-600`}>{value}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                </motion.div>
              ))}
            </div>

            {/* Main cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Resume summary */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
              >
                <h2 className="font-bold text-gray-900 mb-1 flex items-center gap-2">
                  <span>📄</span> Your Resume
                </h2>
                <p className="text-xs text-gray-400 mb-3">{profile.resume.fileName}</p>
                <p className="text-sm text-gray-600 mb-4">
                  {profile.resume.summary || 'No summary available.'}
                </p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {skills.slice(0, 12).map((s) => (
                    <span key={s} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">
                      {s}
                    </span>
                  ))}
                  {skills.length > 12 && (
                    <span className="text-xs bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                      +{skills.length - 12} more
                    </span>
                  )}
                </div>
                <Link
                  to="/upload"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  Update Resume →
                </Link>
              </motion.div>

              {/* Top matches */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
              >
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>🎯</span> Top Matches
                </h2>
                {topMatches.length === 0 ? (
                  <p className="text-sm text-gray-400">
                    No matches yet.{' '}
                    <Link to="/jobs" className="text-blue-600">Browse jobs →</Link>
                  </p>
                ) : (
                  <div className="space-y-3">
                    {topMatches.map((m) => (
                      <div key={m._id} className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{m.job?.title}</p>
                          <p className="text-xs text-gray-400 truncate">{m.job?.company}</p>
                        </div>
                        <div
                          className="flex-shrink-0 text-sm font-bold px-2 py-1 rounded-lg"
                          style={{
                            color: scoreColor(m.matchingScore),
                            background: scoreColor(m.matchingScore) + '15',
                          }}
                        >
                          {m.matchingScore}%
                        </div>
                      </div>
                    ))}
                    <Link to="/jobs" className="text-sm text-blue-600 hover:text-blue-700 font-medium block mt-2">
                      View all recommendations →
                    </Link>
                  </div>
                )}
              </motion.div>

              {/* Quick actions */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
              >
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <span>⚡</span> Quick Actions
                </h2>
                <div className="space-y-2">
                  {[
                    { to: '/jobs', icon: '🎯', label: 'View Recommendations' },
                    { to: '/skills', icon: '📊', label: 'Skill Analysis' },
                    { to: '/upload', icon: '📄', label: 'Update Resume' },
                    { to: '/saved', icon: '⭐', label: 'Saved Jobs' },
                  ].map(({ to, icon, label }) => (
                    <Link
                      key={to}
                      to={to}
                      className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors text-sm text-gray-700 font-medium"
                    >
                      <span className="text-base">{icon}</span>
                      {label}
                      <span className="ml-auto text-gray-300">→</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Charts row */}
            {topMatches.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match score bar chart */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                >
                  <h3 className="font-semibold text-gray-800 mb-4 text-sm">
                    📊 Top Match Scores
                  </h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={barData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(v) => [`${v}%`, 'Match']}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {barData.map((entry, idx) => (
                          <Cell key={idx} fill={barColors[idx % barColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </motion.div>

                {/* Skill radar */}
                {radarData.length >= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm"
                  >
                    <h3 className="font-semibold text-gray-800 mb-4 text-sm">
                      🕸️ Skill Match Radar
                    </h3>
                    <ResponsiveContainer width="100%" height={160}>
                      <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                        <PolarGrid stroke="#e5e7eb" />
                        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10 }} />
                        <Radar
                          name="Matches"
                          dataKey="value"
                          stroke="#6366f1"
                          fill="#6366f1"
                          fillOpacity={0.3}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CandidateDashboard;

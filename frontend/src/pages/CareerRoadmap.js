import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const DIFFICULTY_STYLES = {
  beginner:     { bg: 'bg-green-100',  text: 'text-green-700',  border: 'border-green-200',  dot: 'bg-green-500',  label: 'Beginner'     },
  intermediate: { bg: 'bg-amber-100',  text: 'text-amber-700',  border: 'border-amber-200',  dot: 'bg-amber-500',  label: 'Intermediate' },
  advanced:     { bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200',    dot: 'bg-red-500',    label: 'Advanced'     },
};

const RESOURCE_ICONS = {
  docs:   '📄',
  course: '🎓',
  video:  '▶️',
};

function DifficultyBadge({ difficulty }) {
  const styles = DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.intermediate;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${styles.bg} ${styles.text} ${styles.border}`}>
      {styles.label}
    </span>
  );
}

// ─── Timeline step card ───────────────────────────────────────────────────────

function RoadmapStep({ step, isLast }) {
  const [expanded, setExpanded] = useState(false);
  const styles = DIFFICULTY_STYLES[step.difficulty] || DIFFICULTY_STYLES.intermediate;

  return (
    <div className="flex gap-4">
      {/* Timeline line + dot */}
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md ${styles.dot} ring-4 ring-white`}>
          {step.step}
        </div>
        {!isLast && <div className="w-0.5 bg-gray-200 flex-1 my-1" style={{ minHeight: '24px' }} />}
      </div>

      {/* Card */}
      <div className={`flex-1 mb-6 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden`}>
        {/* Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left p-5 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl" role="img" aria-label="skill">🔧</span>
            <div>
              <h3 className="font-semibold text-gray-900">{step.skill}</h3>
              {step.prerequisites && step.prerequisites.length > 0 && (
                <p className="text-xs text-gray-400 mt-0.5">
                  Prereqs: {step.prerequisites.join(', ')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <DifficultyBadge difficulty={step.difficulty} />
            <span className="text-gray-400 text-sm">{expanded ? '▲' : '▼'}</span>
          </div>
        </button>

        {/* Resources (expanded) */}
        {expanded && step.resources && step.resources.length > 0 && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-4 mb-3">
              📚 Learning Resources
            </h4>
            <ul className="space-y-2">
              {step.resources.map((res, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-base flex-shrink-0">{RESOURCE_ICONS[res.type] || '🔗'}</span>
                  <a
                    href={res.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-words"
                  >
                    {res.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        {expanded && (!step.resources || step.resources.length === 0) && (
          <div className="px-5 pb-5 border-t border-gray-100">
            <p className="text-sm text-gray-400 mt-4">No resources available for this skill.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

const CareerRoadmap = () => {
  const { user } = useAuth();
  const [resume, setResume] = useState(null);
  const [roadmapData, setRoadmapData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const resumeRes = await api.get('/resume/me');
        const resume = resumeRes.data;
        setResume(resume);

        const roadmapRes = await api.get(`/resume/${resume._id}/career-roadmap`);
        setRoadmapData(roadmapRes.data);
      } catch (err) {
        if (err.response?.status === 404) {
          // No resume uploaded yet — handled in render
        } else {
          setError(err.response?.data?.message || 'Failed to load career roadmap');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Generating your career roadmap…</p>
        </div>
      </div>
    );
  }

  if (!resume) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 text-center max-w-md">
          <div className="text-6xl mb-4">🗺️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Resume Found</h2>
          <p className="text-gray-500 mb-6">
            Upload your resume to generate a personalised career roadmap.
          </p>
          <Link
            to="/upload"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
          >
            Upload Resume
          </Link>
        </div>
      </div>
    );
  }

  const targetRole = roadmapData?.targetRole || 'Software Developer';
  const roadmap = roadmapData?.roadmap || [];

  const countByDifficulty = (d) => roadmap.filter((s) => s.difficulty === d).length;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-purple-600 font-medium mb-2">
            <Link to="/skill-analysis" className="hover:underline">Skill Analysis</Link>
            <span>›</span>
            <span>Career Roadmap</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Career Roadmap</h1>
          <p className="text-gray-500 mt-1">
            Your personalised learning plan to reach your target role
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        {/* Goal card */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl p-6 mb-8 shadow-lg">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-3xl">🎯</span>
            <div>
              <p className="text-purple-200 text-sm font-medium uppercase tracking-wide">Career Goal</p>
              <h2 className="text-2xl font-bold">{targetRole}</h2>
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <div className="font-bold text-lg">{roadmap.length}</div>
              <div className="text-purple-200">Skills to Learn</div>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <div className="font-bold text-lg">{countByDifficulty('beginner')}</div>
              <div className="text-purple-200">Beginner</div>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <div className="font-bold text-lg">{countByDifficulty('intermediate')}</div>
              <div className="text-purple-200">Intermediate</div>
            </div>
            <div className="bg-white/20 rounded-xl px-4 py-2 text-center">
              <div className="font-bold text-lg">{countByDifficulty('advanced')}</div>
              <div className="text-purple-200">Advanced</div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 flex-wrap mb-6 text-sm">
          {Object.entries(DIFFICULTY_STYLES).map(([key, styles]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded-full ${styles.dot}`}></span>
              <span className="text-gray-600">{styles.label}</span>
            </div>
          ))}
          <span className="text-gray-400 text-xs self-center">Click a step to view resources</span>
        </div>

        {/* Timeline */}
        {roadmap.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center shadow-sm">
            <div className="text-5xl mb-4">🎉</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">You're All Set!</h3>
            <p className="text-gray-500">
              You already have all the skills required for <strong>{targetRole}</strong>.
              No learning roadmap needed right now.
            </p>
            <Link
              to="/recommendations"
              className="inline-block mt-6 bg-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              View Job Matches →
            </Link>
          </div>
        ) : (
          <div>
            {roadmap.map((step, index) => (
              <RoadmapStep key={step.step} step={step} isLast={index === roadmap.length - 1} />
            ))}

            {/* CTA */}
            <div className="mt-6 bg-blue-50 border border-blue-100 rounded-2xl p-6 text-center">
              <p className="text-blue-700 font-medium mb-3">Ready to start your journey?</p>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link
                  to="/recommendations"
                  className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  View Job Matches →
                </Link>
                <Link
                  to="/skill-analysis"
                  className="bg-white text-blue-600 border border-blue-200 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors"
                >
                  Skill Analysis
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CareerRoadmap;

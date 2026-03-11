const Resume = require('../models/Resume');
const Job = require('../models/Job');
const Match = require('../models/Match');
const { calculateMatch } = require('../utils/matcher');

/**
 * POST /api/job/match
 * Calculate and persist match scores for the logged-in candidate.
 * Optionally pass { jobId } to match against a single job.
 */
const matchJobs = async (req, res) => {
  const resume = await Resume.findOne({ candidate: req.user.id });
  if (!resume) return res.status(404).json({ message: 'Please upload a resume first' });

  const jobFilter = { isActive: true };
  if (req.body.jobId) jobFilter._id = req.body.jobId;

  const jobs = await Job.find(jobFilter);
  if (jobs.length === 0) return res.json([]);

  const results = [];
  for (const job of jobs) {
    const { matchingScore, matchedSkills, missingSkills } = calculateMatch(resume, job);

    const match = await Match.findOneAndUpdate(
      { candidate: req.user.id, resume: resume._id, job: job._id },
      { matchingScore, matchedSkills, missingSkills },
      { upsert: true, new: true }
    );

    results.push({
      match,
      job: {
        _id: job._id,
        title: job.title,
        company: job.company,
        requiredSkills: job.requiredSkills,
        location: job.location,
        applicationLink: job.applicationLink,
      },
    });
  }

  results.sort((a, b) => b.match.matchingScore - a.match.matchingScore);
  res.json(results);
};

/**
 * GET /api/jobs/recommendations
 * Return previously computed (or freshly computed) recommendations.
 */
const getRecommendations = async (req, res) => {
  const resume = await Resume.findOne({ candidate: req.user.id });
  if (!resume) return res.status(404).json({ message: 'Please upload a resume first' });

  // Fetch existing matches
  let matches = await Match.find({ candidate: req.user.id, resume: resume._id })
    .populate('job')
    .sort({ matchingScore: -1 });

  // If no matches yet, compute them on the fly
  if (matches.length === 0) {
    const jobs = await Job.find({ isActive: true });
    for (const job of jobs) {
      const { matchingScore, matchedSkills, missingSkills } = calculateMatch(resume, job);
      await Match.findOneAndUpdate(
        { candidate: req.user.id, resume: resume._id, job: job._id },
        { matchingScore, matchedSkills, missingSkills },
        { upsert: true, new: true }
      );
    }
    matches = await Match.find({ candidate: req.user.id, resume: resume._id })
      .populate('job')
      .sort({ matchingScore: -1 });
  }

  res.json(matches);
};

/**
 * GET /api/candidate/profile
 * Returns the candidate profile with resume and top matches.
 */
const getCandidateProfile = async (req, res) => {
  const resume = await Resume.findOne({ candidate: req.user.id });
  const matches = resume
    ? await Match.find({ candidate: req.user.id, resume: resume._id })
        .populate('job', 'title company requiredSkills')
        .sort({ matchingScore: -1 })
        .limit(5)
    : [];

  res.json({ resume: resume || null, topMatches: matches });
};

/**
 * GET /api/candidate/skill-gap/:jobId
 * Returns the skill gap for a specific job.
 */
const getSkillGap = async (req, res) => {
  const resume = await Resume.findOne({ candidate: req.user.id });
  if (!resume) return res.status(404).json({ message: 'Please upload a resume first' });

  const job = await Job.findById(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const { matchingScore, matchedSkills, missingSkills } = calculateMatch(resume, job);

  res.json({
    job: { _id: job._id, title: job.title, company: job.company },
    candidateSkills: resume.skills,
    requiredSkills: job.requiredSkills,
    matchedSkills,
    missingSkills,
    matchingScore,
  });
};

/**
 * GET /api/recruiter/candidates  (recruiter only)
 * Returns all candidate resumes with their best match score for the recruiter's jobs.
 */
const getCandidatesForRecruiter = async (req, res) => {
  const recruiterJobs = await Job.find({ recruiter: req.user.id }).select('_id');
  const jobIds = recruiterJobs.map((j) => j._id);

  const resumes = await Resume.find().populate('candidate', 'name email');

  const candidateData = await Promise.all(
    resumes.map(async (resume) => {
      const bestMatch = await Match.findOne({
        resume: resume._id,
        job: { $in: jobIds },
      })
        .populate('job', 'title company')
        .sort({ matchingScore: -1 });

      return {
        candidate: resume.candidate,
        resumeId: resume._id,
        skills: resume.skills,
        summary: resume.summary,
        bestMatch: bestMatch
          ? { score: bestMatch.matchingScore, job: bestMatch.job }
          : null,
      };
    })
  );

  res.json(candidateData);
};

module.exports = { matchJobs, getRecommendations, getCandidateProfile, getSkillGap, getCandidatesForRecruiter };

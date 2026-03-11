const Resume = require('../models/Resume');
const Job = require('../models/Job');
const ScrapedJob = require('../models/ScrapedJob');
const Match = require('../models/Match');
const { calculateMatchEnhanced } = require('../utils/matcher');
const { scrapeJobs } = require('../utils/scraper');
const { scrapeAllJobs } = require('../services/jobScraper');

// ─── Response helpers ─────────────────────────────────────────────────────────

/**
 * Normalise a Match document + populated job into the unified recommendation shape.
 */
function normaliseMatchDoc(matchDoc) {
  const job = matchDoc.job || {};
  return {
    id: matchDoc._id ? String(matchDoc._id) : null,
    matchingScore: matchDoc.matchingScore,
    matchedSkills: matchDoc.matchedSkills || [],
    missingSkills: matchDoc.missingSkills || [],
    job: {
      _id: job._id ? String(job._id) : null,
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      requiredSkills: job.requiredSkills || [],
      description: job.description || '',
      url: job.applicationLink || '',
      salary: job.salary || '',
    },
    source: 'db',
  };
}

/**
 * Normalise a scraped job + computed match into the unified recommendation shape.
 */
function normaliseScrapedMatch(scored) {
  const job = scored.job || {};
  return {
    id: scored._id ? String(scored._id) : null,
    matchingScore: scored.matchingScore !== undefined ? scored.matchingScore : (scored.match?.matchingScore ?? 0),
    matchedSkills: scored.matchedSkills !== undefined ? scored.matchedSkills : (scored.match?.matchedSkills ?? []),
    missingSkills: scored.missingSkills !== undefined ? scored.missingSkills : (scored.match?.missingSkills ?? []),
    job: {
      _id: job._id ? String(job._id) : null,
      title: job.title || '',
      company: job.company || '',
      location: job.location || '',
      requiredSkills: job.requiredSkills || job.skills || [],
      description: job.description || '',
      url: job.url || job.applicationLink || '',
      salary: job.salary || '',
    },
    source: scored.source || 'scraped',
  };
}

// ─── Controllers ──────────────────────────────────────────────────────────────

/**
 * POST /api/jobs/match
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
    const { matchingScore, matchedSkills, missingSkills } = calculateMatchEnhanced(resume, job);

    const match = await Match.findOneAndUpdate(
      { candidate: req.user.id, resume: resume._id, job: job._id },
      { matchingScore, matchedSkills, missingSkills },
      { upsert: true, new: true },
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
 * GET /api/jobs/recommendations/:userId   (admin / webhook variant)
 *
 * Returns previously-computed (or freshly computed) recommendations in a
 * unified shape: { id, matchingScore, matchedSkills, missingSkills, job, source }.
 *
 * Auto-triggers real-time job scraping when fewer than 10 recommendations exist.
 */
const getRecommendations = async (req, res) => {
  // Support optional :userId param for admin/service use; fall back to JWT user
  const candidateId = req.params.userId || req.user.id;

  const resume = await Resume.findOne({ candidate: candidateId });
  if (!resume) return res.status(404).json({ message: 'Please upload a resume first' });

  // ── Load existing DB matches ──────────────────────────────────────────────
  let matches = await Match.find({ candidate: candidateId, resume: resume._id })
    .populate('job')
    .sort({ matchingScore: -1 });

  // Compute on-the-fly if no matches yet
  if (matches.length === 0) {
    const jobs = await Job.find({ isActive: true });
    for (const job of jobs) {
      const { matchingScore, matchedSkills, missingSkills } = calculateMatchEnhanced(resume, job);
      await Match.findOneAndUpdate(
        { candidate: candidateId, resume: resume._id, job: job._id },
        { matchingScore, matchedSkills, missingSkills },
        { upsert: true, new: true },
      );
    }
    matches = await Match.find({ candidate: candidateId, resume: resume._id })
      .populate('job')
      .sort({ matchingScore: -1 });
  }

  // Filter out any matches where the job was deleted
  const dbResults = matches
    .filter((m) => m.job != null)
    .map(normaliseMatchDoc);

  // ── Auto-trigger scraping when < 10 recommendations ──────────────────────
  if (dbResults.length < 10) {
    let scrapedResults = [];

    try {
      // Try the advanced multi-source scraper first
      const scraped = await scrapeAllJobs(resume.skills || [], resume, 50);
      scrapedResults = scraped.map(normaliseScrapedMatch);
    } catch (advancedErr) {
      console.warn('[Recommendations] Advanced scraper failed, falling back:', advancedErr.message);

      // Fall back to the original scraper utility
      try {
        const legacyData = await scrapeJobs(resume.skills || [], 30);
        for (const jobData of legacyData) {
          try {
            const filter = jobData.externalId
              ? { externalId: jobData.externalId, source: jobData.source }
              : { title: jobData.title, company: jobData.company, source: jobData.source };
            await ScrapedJob.findOneAndUpdate(filter, jobData, {
              upsert: true, new: true, setDefaultsOnInsert: true,
            });
          } catch (err) {
            if (err.code !== 11000) console.error('[Recommendations] Scrape save error:', err.message);
          }
        }
        const storedScraped = await ScrapedJob.find({ isActive: true })
          .sort({ scrapedAt: -1 })
          .limit(30);
        scrapedResults = storedScraped.map((job) => {
          const { matchingScore, matchedSkills, missingSkills } = calculateMatchEnhanced(resume, {
            requiredSkills: job.requiredSkills,
            description: job.description,
            title: job.title,
          });
          return normaliseScrapedMatch({
            matchingScore, matchedSkills, missingSkills, job, source: 'scraped',
          });
        });
      } catch (legacyErr) {
        console.error('[Recommendations] Legacy scraper also failed:', legacyErr.message);
      }
    }

    // Merge DB and scraped results, deduplicate by title+company, sort by score
    const seen = new Set(dbResults.map((r) => `${r.job.title}||${r.job.company}`));
    const fresh = scrapedResults.filter((r) => {
      const key = `${r.job.title}||${r.job.company}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const combined = [...dbResults, ...fresh].sort((a, b) => b.matchingScore - a.matchingScore);
    return res.json(combined);
  }

  res.json(dbResults);
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

  let job = await Job.findById(req.params.jobId).catch(() => null);
  if (!job) {
    job = await ScrapedJob.findById(req.params.jobId).catch(() => null);
  }
  if (!job) return res.status(404).json({ message: 'Job not found' });

  const { matchingScore, matchedSkills, missingSkills } = calculateMatchEnhanced(resume, job);

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
    }),
  );

  res.json(candidateData);
};

module.exports = {
  matchJobs,
  getRecommendations,
  getCandidateProfile,
  getSkillGap,
  getCandidatesForRecruiter,
};

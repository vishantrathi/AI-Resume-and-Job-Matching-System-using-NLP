const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  getCandidateProfile,
  getSkillGap,
  getCandidatesForRecruiter,
} = require('../controllers/matchController');

// GET /api/candidate/profile
router.get('/profile', protect, requireRole('candidate'), getCandidateProfile);

// GET /api/candidate/skill-gap/:jobId
router.get('/skill-gap/:jobId', protect, requireRole('candidate'), getSkillGap);

// GET /api/recruiter/candidates
router.get('/recruiter/candidates', protect, requireRole('recruiter'), getCandidatesForRecruiter);

module.exports = router;

const express = require('express');
const router = express.Router();
const { protect, requireRole } = require('../middleware/auth');
const {
  createJob, getAllJobs, getJobById, updateJob, deleteJob, getMyJobs, jobValidation,
} = require('../controllers/jobController');
const { matchJobs, getRecommendations } = require('../controllers/matchController');

// GET /api/jobs/recommendations  (candidate)
router.get('/recommendations', protect, requireRole('candidate'), getRecommendations);

// GET /api/jobs/recruiter/mine  (recruiter)
router.get('/recruiter/mine', protect, requireRole('recruiter'), getMyJobs);

// POST /api/jobs  (recruiter)
router.post('/', protect, requireRole('recruiter'), jobValidation, createJob);

// POST /api/job/match  (candidate)
router.post('/match', protect, requireRole('candidate'), matchJobs);

// GET /api/jobs
router.get('/', getAllJobs);

// GET /api/jobs/:id
router.get('/:id', getJobById);

// PUT /api/jobs/:id  (recruiter)
router.put('/:id', protect, requireRole('recruiter'), updateJob);

// DELETE /api/jobs/:id  (recruiter)
router.delete('/:id', protect, requireRole('recruiter'), deleteJob);

module.exports = router;

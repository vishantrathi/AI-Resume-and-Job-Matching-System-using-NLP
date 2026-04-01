const express = require('express');
const router = express.Router();
const { register, registerValidation, login, loginValidation, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.get('/profile', protect, getProfile);

module.exports = router;

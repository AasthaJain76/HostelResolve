import express from 'express'
import {
    signup,
    login,
    loginLimiter,
    logout,
    refreshAccessToken,
    getProfile,
    updateProfile,
    getUsers
} from '../controllers/authController.js'
import { protect, authorize } from '../middlewares/auth.js'
import { validate } from '../middlewares/validate.js'
import { signupValidation, loginValidation } from '../validators/authValidator.js'
import { updateProfileValidation } from '../validators/userValidator.js'

const router = express.Router();

router.post('/signup', signupValidation, validate, signup);
router.post('/login', loginLimiter, loginValidation, validate, login);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, validate, updateProfile);
router.get('/users', protect, authorize('warden'), getUsers);

export default router;
import express from 'express'
import {
    signup,
    login,
    loginLimiter,
    logout,
    refreshAccessToken,
    getProfile,
    updateProfile,
    changePassword,
    getUsers,
    forgotPassword,
    resetPassword
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
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfileValidation, validate, updateProfile);
router.put('/profile/change-password', protect, changePassword);
router.get('/users', protect, authorize('warden'), getUsers);

export default router;
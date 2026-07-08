import express from 'express';
import { applyLeave, getLeaves, updateLeaveStatus } from '../controllers/leaveController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);

router.post('/', applyLeave);
router.get('/', getLeaves);
router.put('/:id/status', authorize('warden'), updateLeaveStatus);

export default router;
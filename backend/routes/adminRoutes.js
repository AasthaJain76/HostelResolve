import express from 'express';
import { createWarden, getAdminStats, getEscalatedComplaints, resolveEscalatedComplaint } from '../controllers/adminController.js';
import { protect, authorize } from '../middlewares/auth.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin')); // Restrict all these endpoints to admin only

router.post('/wardens', createWarden);
router.get('/stats', getAdminStats);
router.get('/escalated', getEscalatedComplaints);
router.put('/complaints/:id/resolve', resolveEscalatedComplaint);

export default router;
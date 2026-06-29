import express from 'express';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from '../controllers/announcementController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('warden'), upload.array('images', 5), createAnnouncement);
router.delete('/:id', authorize('warden'), deleteAnnouncement);

export default router;

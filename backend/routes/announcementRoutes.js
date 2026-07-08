import express from 'express';
import { 
    createAnnouncement, 
    getAnnouncements, 
    deleteAnnouncement,
    updateAnnouncement,
    togglePinAnnouncement
} from '../controllers/announcementController.js';
import { protect, authorize } from '../middlewares/auth.js';
import { upload } from '../middlewares/uploadMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getAnnouncements);
router.post('/', authorize('warden'), upload.array('images', 5), createAnnouncement);
router.put('/:id', authorize('warden'), upload.array('images', 5), updateAnnouncement);
router.patch('/:id/pin', authorize('warden'), togglePinAnnouncement);
router.delete('/:id', authorize('warden'), deleteAnnouncement);

export default router;

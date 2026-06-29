import express from 'express'
import {
    createComplaint,
    getComplaints,
    getComplaintById,
    updateComplaint,
    getComplaintStats,
    addComment,
    editComment,
    deleteComment,
    upvoteComplaint,
    deleteComplaint,
    submitFeedback,
    reopenComplaint,
} from '../controllers/complaintController.js'

import {protect, authorize} from '../middlewares/auth.js'
import {upload} from '../middlewares/uploadMiddleware.js'
import { validate } from '../middlewares/validate.js'
import {
    createComplaintValidation,
    updateComplaintValidation,
    complaintIdValidation,
    commentValidation,
    editCommentValidation,
    deleteCommentValidation,
    feedbackValidation,
    reopenComplaintValidation,
    getComplaintsQueryValidation,
} from '../validators/complaintValidator.js'


const router = express.Router();

router.use(protect);

router.get('/', getComplaintsQueryValidation, validate, getComplaints);
router.post('/', upload.array('images', 5), createComplaintValidation, validate, createComplaint);

router.get('/stats', authorize("warden"), getComplaintStats);

router.get('/:id', complaintIdValidation, validate, getComplaintById);
router.put('/:id', 
    upload.fields([
        { name : 'images', maxCount: 5},
        { name : 'resolvedImages', maxCount: 5}
    ]),
    updateComplaintValidation,
    validate,
    updateComplaint
);
router.delete('/:id', complaintIdValidation, validate, authorize("warden"), deleteComplaint);

router.post('/:id/comments', complaintIdValidation, commentValidation, validate, addComment);
router.put('/:id/comments/:commentId', editCommentValidation, validate, editComment);
router.delete('/:id/comments/:commentId', deleteCommentValidation, validate, deleteComment);

router.post('/:id/upvote', complaintIdValidation, validate, upvoteComplaint);
router.post('/:id/feedback', complaintIdValidation, feedbackValidation, validate, submitFeedback);
router.post('/:id/reopen', complaintIdValidation, reopenComplaintValidation, validate, reopenComplaint);

export default router;

import { body, param, query } from 'express-validator';

const CATEGORIES = ['PLUMBING', 'ELECTRICAL', 'INTERNET', 'INFRASTRUCTURE', 'MESS', 'CLEANING', 'SECURITY', 'OTHER'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['PENDING', 'IN_PROGRESS', 'RESOLVED', 'REJECTED'];

export const complaintIdValidation = [
    param('id')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Invalid complaint ID'),
];

export const deleteCommentValidation = [
    param('id')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Invalid complaint ID'),

    param('commentId')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Invalid comment ID'),
];

export const createComplaintValidation = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),

    body('description')
        .trim()
        .notEmpty()
        .withMessage('Description is required')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),

    body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required')
        .isIn(CATEGORIES)
        .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

    body('priority')
        .optional()
        .trim()
        .isIn(PRIORITIES)
        .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),

    body('hostel')
        .trim()
        .notEmpty()
        .withMessage('Hostel is required')
        .isLength({ max: 100 })
        .withMessage('Hostel name must not exceed 100 characters'),

    body('room')
        .trim()
        .notEmpty()
        .withMessage('Room is required')
        .isLength({ max: 20 })
        .withMessage('Room must not exceed 20 characters'),
];

export const updateComplaintValidation = [
    param('id')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Invalid complaint ID'),

    body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Title cannot be empty')
        .isLength({ min: 5, max: 100 })
        .withMessage('Title must be between 5 and 100 characters'),

    body('description')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Description cannot be empty')
        .isLength({ min: 10, max: 1000 })
        .withMessage('Description must be between 10 and 1000 characters'),

    body('category')
        .optional()
        .trim()
        .isIn(CATEGORIES)
        .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

    body('priority')
        .optional()
        .trim()
        .isIn(PRIORITIES)
        .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),

    body('status')
        .optional()
        .trim()
        .isIn(STATUSES)
        .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),

    body('assignedTo')
        .optional()
        .isUUID()
        .withMessage('Invalid assigned user ID'),
];

export const getComplaintsQueryValidation = [
    query('status')
        .optional()
        .trim()
        .isIn(STATUSES)
        .withMessage(`Status must be one of: ${STATUSES.join(', ')}`),

    query('category')
        .optional()
        .trim()
        .isIn(CATEGORIES)
        .withMessage(`Category must be one of: ${CATEGORIES.join(', ')}`),

    query('priority')
        .optional()
        .trim()
        .isIn(PRIORITIES)
        .withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`),

    query('search')
        .optional()
        .trim()
        .isLength({ min: 1, max: 100 })
        .withMessage('Search term must be between 1 and 100 characters'),
];

export const commentValidation = [
    body('text')
        .trim()
        .notEmpty()
        .withMessage('Comment text is required')
        .isLength({ min: 1, max: 500 })
        .withMessage('Comment must be between 1 and 500 characters'),
];

export const editCommentValidation = [
    param('id')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Invalid complaint ID'),

    param('commentId')
        .isString()
        .trim()
        .notEmpty()
        .withMessage('Invalid comment ID'),

    body('text')
        .trim()
        .notEmpty()
        .withMessage('Comment text is required')
        .isLength({ min: 1, max: 500 })
        .withMessage('Comment must be between 1 and 500 characters'),
];

export const feedbackValidation = [
    body('rating')
        .notEmpty()
        .withMessage('Rating is required')
        .isInt({ min: 1, max: 5 })
        .withMessage('Rating must be between 1 and 5'),

    body('comment')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Feedback comment must not exceed 500 characters'),
];

export const reopenComplaintValidation = [
    body('reason')
        .optional()
        .trim()
        .isLength({ min: 5, max: 500 })
        .withMessage('Reason must be between 5 and 500 characters'),
];

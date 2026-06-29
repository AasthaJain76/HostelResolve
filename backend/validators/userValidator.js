import { body } from 'express-validator';

export const updateProfileValidation = [
    body()
        .custom((_, { req }) => {
            const { name, phone, hostel, room, password } = req.body;

            if (!name && !phone && !hostel && !room && !password) {
                throw new Error('At least one field must be provided to update');
            }

            return true;
        }),

    body('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Name cannot be empty')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters'),

    body('phone')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Phone number cannot be empty')
        .matches(/^[0-9]{10}$/)
        .withMessage('Phone number must be a valid 10-digit number'),

    body('hostel')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Hostel cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Hostel name must not exceed 100 characters'),

    body('room')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Room cannot be empty')
        .isLength({ max: 20 })
        .withMessage('Room must not exceed 20 characters'),

    body('password')
        .optional()
        .isLength({ min: 8 })
        .withMessage('Password must be at least 8 characters long'),
];

const { body } = require('express-validator');
module.exports = {
    registerValidator:  [
        body('email')
        .trim()
        .isEmail()
        .withMessage('Email must be a valid email')
        .normalizeEmail()
        .toLowerCase(),
        body('password')
        .trim()
        .isLength({ min: 5 })
        .withMessage('Password length is too short, minimum 3 characters are required'),
        body('password2').custom((value, {req}) => {
            if (value !== req.body.password) {
                throw new Error('password do not match');
            }
            return true;
        }),
    ],
}
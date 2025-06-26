import express from 'express';
import {
    login,
    register,
    requestPasswordReset,
    resetPassword,
} from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *     - Auth Controller
 *     summary: Register a new user for SmartKid Math Game
 *     description: This endpoint allows you to create a new user in the SmartKid Math Game system.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - usertype
 *               - username
 *               - email
 *               - password
 *               - country
 *             properties:
 *               usertype:
 *                 type: string
 *                 enum: ['Admin', 'Customer']
 *                 example: Customer
 *                 description: Type of user account
 *               username:
 *                 type: string
 *                 maxLength: 100
 *                 example: johndoe
 *                 description: Unique username for the account
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 example: johndoe@mail.com
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 maxLength: 255
 *                 example: JohnDoe20!@
 *                 description: User's password
 *               full_name:
 *                 type: string
 *                 maxLength: 255
 *                 example: John Doe
 *                 description: User's full name
 *               avatar:
 *                 type: string
 *                 maxLength: 255
 *                 example: https://example.com/avatar.jpg
 *                 description: URL to user's avatar image
 *               age:
 *                 type: string
 *                 format: date
 *                 example: 2010-05-15
 *                 description: User's birthdate
 *               country:
 *                 type: string
 *                 maxLength: 2
 *                 example: US
 *                 description: ISO 3166-1 alpha-2 country code (e.g., US, VN)
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User successfully registered!
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                       description: Auto-incremented user ID
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     usertype:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     coins:
 *                       type: integer
 *                     current_level:
 *                       type: integer
 *                     experience_points:
 *                       type: integer
 *       400:
 *         description: Bad Request - Invalid user input
 *       409:
 *         description: Conflict - User already exists
 *       500:
 *         description: Server Error
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags:
 *     - Auth Controller
 *     summary: Log in a user to SmartKid Math Game
 *     description: This endpoint allows a user to log in and receive authentication token and user statistics.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: johndoe
 *                 description: User's username
 *               password:
 *                 type: string
 *                 example: JohnDoe20!@
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                   description: JWT authentication token
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                       description: Auto-incremented user ID
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     usertype:
 *                       type: string
 *                     full_name:
 *                       type: string
 *                     avatar:
 *                       type: string
 *                     coins:
 *                       type: integer
 *                     followers_count:
 *                       type: integer
 *                     following_count:
 *                       type: integer
 *                     experience_points:
 *                       type: integer
 *                     current_level:
 *                       type: integer
 *                     level_progress:
 *                       type: number
 *                     statistics:
 *                       type: object
 *                       properties:
 *                         games_played:
 *                           type: integer
 *                         best_score:
 *                           type: integer
 *                         total_score:
 *                           type: integer
 *       400:
 *         description: Bad Request - Missing or invalid input
 *       401:
 *         description: Unauthorized - Invalid username/password or inactive account
 *       500:
 *         description: Server error
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     tags:
 *     - Auth Controller
 *     summary: Request password reset
 *     description: Allows a user to request a password reset link to be sent to their email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@mail.com
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password reset email has been sent.
 *       400:
 *         description: Bad Request - Invalid email or inactive account
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/forgot-password', requestPasswordReset);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     tags:
 *     - Auth Controller
 *     summary: Reset the password
 *     description: Allows a user to reset their password using a token they received via email.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 description: Password reset token sent to the user's email
 *                 example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *               newPassword:
 *                 type: string
 *                 description: The new password to be set
 *                 example: NewStrongPassword!23
 *     responses:
 *       200:
 *         description: Password successfully reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password has been successfully reset.
 *       400:
 *         description: Bad Request - Invalid token, password, or inactive account
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/reset-password', resetPassword);

export default router;
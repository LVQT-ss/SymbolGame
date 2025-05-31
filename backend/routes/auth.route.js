import express from 'express';
import {
    login,
    register,
    // requestPasswordReset,
    // resetPassword,
} from '../controllers/auth.controller.js';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags:
 *     - Auth Controller
 *     summary: Register a new user
 *     description: This endpoint allows you to create a new user in the system by providing the necessary details.
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
 *             properties:
 *               usertype:
 *                 type: string
 *                 enum: ['Staff', 'Customer']
 *                 example: Customer
 *               username:
 *                 type: string
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: johndoe@mail.com
 *               password:
 *                 type: string
 *                 example: JohnDoe20!@
 *               userAddress:
 *                 type: string
 *                 example: 123 Main St, Anytown, USA
 *               userPhoneNumber:
 *                 type: string
 *                 example: +1234567890
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
 *     summary: Log in a user
 *     description: This endpoint allows a user to log in by providing their username and password.
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
 *                 example: admin
 *               password:
 *                 type: string
 *                 example: admin
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
 *                 user:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: integer
 *                     username:
 *                       type: string
 *                     email:
 *                       type: string
 *                     usertype:
 *                       type: string
 *       400:
 *         description: Bad Request - Missing or invalid input
 *       401:
 *         description: Unauthorized - Invalid username or password
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
 *                   example: Password reset email sent successfully.
 *       400:
 *         description: Bad Request - Invalid email
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
// router.post('/forgot-password', requestPasswordReset);

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
 *                   example: Password successfully reset.
 *       400:
 *         description: Bad Request - Invalid token or password
 *       403:
 *         description: Forbidden - Expired or invalid token
 *       500:
 *         description: Server error
 */
// router.post('/reset-password', resetPassword);
export default router;
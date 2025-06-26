import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import process from 'process';
import User from '../model/user.model.js';
import UserStatistics from '../model/user-statistics.model.js';
import { sendPasswordResetEmail } from '../utils/mailer.js';
import 'dotenv/config'

export const register = async (req, res) => {
  const { usertype, username, email, password, full_name, avatar, age } = req.body;

  if (!usertype || !username || !email || !password) {
    return res.status(400).json({ message: 'Please provide all required fields: usertype, username, email, password.' });
  }

  const validusertypes = ['Admin', 'Customer'];
  if (!validusertypes.includes(usertype)) {
    return res.status(400).json({ message: 'Invalid usertype. Must be Admin or Customer.' });
  }

  // Validate field lengths based on new model
  if (username.length > 100 || email.length > 255 || password.length > 255 ||
    (full_name && full_name.length > 255) || (avatar && avatar.length > 255)) {
    return res.status(400).json({ message: 'Input data exceeds allowed length.' });
  }

  try {
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user with new model structure
    const user = await User.create({
      usertype,
      username,
      email,
      password: hashedPassword,
      full_name: full_name || null,
      avatar: avatar || null,
      age: age ? new Date(age) : null,
      // Default values for gaming fields
      coins: 0,
      followers_count: 0,
      following_count: 0,
      experience_points: 0,
      current_level: 1,
      level_progress: 0.0,
      is_active: true
    });

    // Create user statistics for all difficulty levels (1=Easy, 2=Medium, 3=Hard)
    const difficultyLevels = [1, 2, 3];
    for (const difficulty of difficultyLevels) {
      await UserStatistics.create({
        user_id: user.id,
        difficulty_level: difficulty,
        games_played: 0,
        best_score: 0,
        best_score_time: null,
        best_score_achieved_at: null,
        total_score: 0
      });
    }

    // Remove password from response
    const userResponse = { ...user.dataValues };
    delete userResponse.password;

    res.status(201).json({
      message: 'User successfully registered!',
      user: userResponse
    });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Username or email already exists. Please choose a different one.' });
    }
    console.error('Error creating user:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required" });
  }

  try {
    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: UserStatistics,
          as: 'statistics'
        }
      ]
    });

    if (!user) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({ message: "Account is inactive. Please contact support." });
    }

    const passwordMatch = await bcryptjs.compare(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign(
      {
        userId: user.id, // Updated to use new field name
        usertype: user.usertype,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar: user.avatar,
        coins: user.coins,
        current_level: user.current_level,
        experience_points: user.experience_points
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userWithoutPassword = { ...user.dataValues };
    delete userWithoutPassword.password;

    res.status(200).json({
      message: "Login successful",
      token: token,
      user: userWithoutPassword
    });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Please provide an email address.' });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: 'Email not found.' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json({ message: 'Account is inactive. Please contact support.' });
    }

    // Create a JWT token for password reset with a short expiration time (e.g., 1 hour)
    const token = jwt.sign(
      { userId: user.id, email: user.email }, // Updated to use new field name
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Generate reset link with token
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    // Send the password reset email with the token link
    await sendPasswordResetEmail(user.email, resetLink);

    res.status(200).json({ message: 'Password reset email has been sent.' });
  } catch (error) {
    console.error('Error processing password reset request:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};

export const resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return res.status(400).json({ message: 'Token and new password are required.' });
  }

  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId } = decoded;

    // Find the user using the userId from the token
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(400).json({ message: 'Account is inactive. Please contact support.' });
    }

    // Hash the new password
    const hashedPassword = await bcryptjs.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: 'Password has been successfully reset.' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ message: 'Reset link has expired. Please request a new password reset.' });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(400).json({ message: 'Invalid reset token.' });
    }
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'Server error, please try again later.' });
  }
};
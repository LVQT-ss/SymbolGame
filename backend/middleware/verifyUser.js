import jwt from 'jsonwebtoken';
import process from 'process';
import { errorHandler } from '../utils/error.js';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return next(errorHandler(401, 'Access denied. No token provided.'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Updated to use new field names and add more user info
    req.userId = decoded.userId;
    req.userType = decoded.usertype;
    req.username = decoded.username;
    req.userEmail = decoded.email;
    req.userFullName = decoded.full_name;
    req.userAvatar = decoded.avatar;
    req.userCoins = decoded.coins;
    req.userLevel = decoded.current_level;
    req.userXP = decoded.experience_points;

    next();
  } catch (err) {
    return next(errorHandler(401, 'Invalid token.'));
  }
};

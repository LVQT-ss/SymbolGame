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
    req.userId = decoded.userId;
    req.userType = decoded.usertype;
    next();
  } catch (err) {
    return next(errorHandler(401, 'Invalid token.'));
  }
};

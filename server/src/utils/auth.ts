import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';
dotenv.config();

interface JwtPayload {
  _id: unknown;
  username: string;
  email: string;
}

// Middleware for Express and GraphQL Context Setup
export const authenticateToken = (req: Request, _: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    const secretKey = process.env.JWT_SECRET_KEY || '';

    jwt.verify(token, secretKey, (err, user) => {
      if (err) {
        return next(new Error('Forbidden: Invalid or expired token.'));
      }

      // Attach user to request for context
      req.user = user as JwtPayload;
      return next();
    });
  } else {
    next(new Error('Unauthorized: No token provided.'));
  }
};

// Helper to generate JWTs
export const signToken = (username: string, email: string, _id: unknown) => {
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY || '';

  return jwt.sign(payload, secretKey, { expiresIn: '1h' });
};

// Context Function for GraphQL
export const contextMiddleware = ({ req }: { req: Request }) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new Error('Unauthorized: No token provided.');
  }

  const token = authHeader.split(' ')[1];
  const secretKey = process.env.JWT_SECRET_KEY || '';

  try {
    const user = jwt.verify(token, secretKey) as JwtPayload;
    return { user }; // Pass user to GraphQL context
  } catch (err) {
    throw new Error('Forbidden: Invalid or expired token.');
  }
};

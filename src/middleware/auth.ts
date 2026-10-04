import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: {
    uid: string;
    email: string;
    name?: string;
    role?: 'owner' | 'staff' | 'viewer';
  } | DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-printhub-role'] as string | undefined;
  const userEmailHeader = req.headers['x-printhub-email'] as string | undefined;

  // If a valid demo/preview role header is supplied, populate session user
  if (roleHeader && ['owner', 'staff', 'viewer'].includes(roleHeader)) {
    req.user = {
      uid: `user_${roleHeader}`,
      email: userEmailHeader || `${roleHeader}@printhub3d.com`,
      name: roleHeader === 'owner' ? 'Harish & Geeta (Owner)' : roleHeader === 'staff' ? 'Rohan Sharma (Lab Tech)' : 'Pooja Iyer (Accounts)',
      role: roleHeader as 'owner' | 'staff' | 'viewer',
    };
    return next();
  }

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

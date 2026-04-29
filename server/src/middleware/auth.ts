import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const secret = process.env.JWT_SECRET || 'super_secret_jwt_key_12345';

export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, secret, (err, user) => {
      if (err) {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }
      (req as any).user = user;
      next();
    });
  } else {
    res.status(401).json({ error: 'Unauthorized' });
  }
};

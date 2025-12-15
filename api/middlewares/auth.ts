import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

/**
 * Middleware to authenticate requests using a JWT token.
 *
 * This function checks for the presence of an `Authorization` header,
 * extracts the token, and verifies it using the secret key defined in
 * the environment variable `JWT_SECRET`. If the token is valid, the
 * decoded user information is attached to the request object. Otherwise,
 * it responds with an appropriate HTTP error status.
 *
 * @function authenticateToken
 * @param {Request} req - Express request object. The JWT token is expected
 *   in the `Authorization` header as `Bearer <token>`.
 * @param {Response} res - Express response object used to send error messages
 *   when authentication fails.
 * @param {NextFunction} next - Express next middleware function. Called if
 *   the token is successfully verified.
 *
 * @returns {void} Sends a `401 Unauthorized` response if no token is provided,
 *   or a `403 Forbidden` response if the token is invalid. Calls `next()` if
 *   authentication succeeds.
 *
 * @example
 * // Usage in an Express route
 * import { authenticateToken } from './middleware/auth';
 *
 * app.get('/protected', authenticateToken, (req, res) => {
 *   res.json({ message: 'Access granted', user: (req as any).user });
 * });
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.warn('⚠️ [AUTH] Token no proporcionado');
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET!, (err: any, user: any) => {
    if (err) {
      console.error('❌ [AUTH] Token inválido:', err.message);
      return res.status(403).json({ error: 'Token inválido' });
    }

    (req as any).user = user;
    next();
  });
};
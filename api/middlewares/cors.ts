import { Request, Response, NextFunction } from 'express';

const allowedOrigins = [
  'https://frontend-real-time.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  'https://realtime-frontend.vercel.app'
];


/**
 * CORS configuration options for Express.
 *
 * This object defines the allowed origins, HTTP methods, headers,
 * and credentials policy for handling cross-origin requests.
 *
 * - The `origin` function dynamically checks whether the request's origin
 *   is included in the `allowedOrigins` list or contains "vercel.app".
 *   If valid, the request is allowed; otherwise, it is blocked.
 * - The `methods` property specifies which HTTP methods are permitted.
 * - The `credentials` property enables cookies and authorization headers
 *   to be sent in cross-origin requests.
 * - The `allowedHeaders` property defines which headers are permitted
 *   in requests from allowed origins.
 *
 * @constant
 * @type {object}
 * @property {(origin: string | undefined, callback: Function) => void} origin - Function to validate request origin.
 * @property {string[]} methods - Allowed HTTP methods.
 * @property {boolean} credentials - Whether credentials are allowed in CORS requests.
 * @property {string[]} allowedHeaders - Allowed request headers.
 *
 * @example
 * import cors from 'cors';
 * import { corsOptions } from './middleware/cors';
 *
 * app.use(cors(corsOptions));
 */
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {  // Corregido: Agregado 'undefined'
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      console.log('🚫 Origen bloqueado por CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

/**
 * Custom CORS middleware for Express.
 *
 * This middleware manually sets CORS headers for incoming requests.
 * It allows requests from specific origins defined in `allowedOrigins`
 * or any origin containing "vercel.app". It also sets headers for
 * allowed methods, headers, and credentials.
 *
 * If the request method is `OPTIONS`, it responds immediately with
 * a `200 OK` status to handle preflight requests.
 *
 * @function corsMiddleware
 * @param {Request} req - Express request object. The origin is checked from `req.headers.origin`.
 * @param {Response} res - Express response object. Used to set CORS headers.
 * @param {NextFunction} next - Express next middleware function. Called if the request is not preflight.
 *
 * @returns {void} Sends a `200 OK` response for preflight requests or calls `next()` for other requests.
 *
 * @example
 * import { corsMiddleware } from './middleware/cors';
 *
 * app.use(corsMiddleware);
 */
export const corsMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  if (origin && (allowedOrigins.includes(origin) || origin.includes('vercel.app'))) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};
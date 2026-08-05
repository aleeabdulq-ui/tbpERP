import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../lib/errors.js';
export function authenticate(req, _res, next) { const raw = req.headers.authorization; if (!raw?.startsWith('Bearer '))
    return next(new AppError(401, 'Authentication required', 'UNAUTHENTICATED')); try {
    const p = jwt.verify(raw.slice(7), config.JWT_ACCESS_SECRET);
    req.auth = { userId: Number(p.sub), role: p.role, permissions: p.permissions };
    next();
}
catch {
    next(new AppError(401, 'Access token is invalid or expired', 'INVALID_TOKEN'));
} }
export const authorize = (...permissions) => (req, _res, next) => { if (!req.auth)
    return next(new AppError(401, 'Authentication required')); if (req.auth.permissions.includes('*') || permissions.some(p => req.auth.permissions.includes(p)))
    return next(); next(new AppError(403, 'You do not have permission to perform this action', 'FORBIDDEN')); };

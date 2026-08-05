import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../../lib/prisma.js';
import { config } from '../../config.js';
import { AppError } from '../../lib/errors.js';
import { authenticate } from '../../middleware/auth.js';
const router = Router();
const loginSchema = z.object({ email: z.string().email(), password: z.string().min(8), rememberMe: z.boolean().default(false) });
const hash = (v) => crypto.createHash('sha256').update(v).digest('hex');
async function issue(res, user, remember = false) { const permissions = Array.isArray(user.role.permissions) ? user.role.permissions : []; const accessToken = jwt.sign({ role: user.role.name, permissions }, config.JWT_ACCESS_SECRET, { subject: String(user.id), expiresIn: config.ACCESS_TOKEN_TTL }); const raw = crypto.randomBytes(48).toString('base64url'); const days = remember ? 30 : config.REFRESH_TOKEN_DAYS; await prisma.refreshToken.create({ data: { tokenHash: hash(raw), userId: user.id, expiresAt: new Date(Date.now() + days * 864e5) } }); res.cookie('refreshToken', raw, { httpOnly: true, sameSite: 'strict', secure: config.COOKIE_SECURE, maxAge: days * 864e5, path: '/api/v1/auth' }); const csrf = crypto.randomBytes(24).toString('base64url'); res.cookie('csrfToken', csrf, { httpOnly: false, sameSite: 'strict', secure: config.COOKIE_SECURE, path: '/' }); return { accessToken, csrfToken: csrf, user: { id: user.id, email: user.email, role: user.role.name, permissions, name: `${user.employee?.firstName ?? ''} ${user.employee?.lastName ?? ''}`.trim() } }; }
router.post('/login', async (req, res, next) => { try {
    const input = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({ where: { email: input.email.toLowerCase(), deletedAt: null }, include: { role: true, employee: true } });
    if (!user || !await bcrypt.compare(input.password, user.passwordHash))
        throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS');
    res.json(await issue(res, user, input.rememberMe));
}
catch (e) {
    next(e);
} });
router.post('/refresh', async (req, res, next) => { try {
    const raw = req.cookies.refreshToken;
    const csrf = req.headers['x-csrf-token'];
    if (!raw || !csrf || csrf !== req.cookies.csrfToken)
        throw new AppError(403, 'CSRF validation failed', 'CSRF_FAILED');
    const session = await prisma.refreshToken.findUnique({ where: { tokenHash: hash(raw) }, include: { user: { include: { role: true, employee: true } } } });
    if (!session || session.revokedAt || session.expiresAt < new Date())
        throw new AppError(401, 'Refresh token is invalid', 'INVALID_REFRESH_TOKEN');
    await prisma.refreshToken.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    res.json(await issue(res, session.user));
}
catch (e) {
    next(e);
} });
router.post('/logout', authenticate, async (req, res, next) => { try {
    const raw = req.cookies.refreshToken;
    if (raw)
        await prisma.refreshToken.updateMany({ where: { tokenHash: hash(raw) }, data: { revokedAt: new Date() } });
    res.clearCookie('refreshToken', { path: '/api/v1/auth' }).clearCookie('csrfToken', { path: '/' }).status(204).send();
}
catch (e) {
    next(e);
} });
router.post('/forgot-password', async (req, res, next) => { try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (user) {
        const raw = crypto.randomBytes(32).toString('base64url');
        await prisma.passwordResetToken.create({ data: { email: user.email, tokenHash: hash(raw), expiresAt: new Date(Date.now() + 3600000) } });
        if (config.NODE_ENV === 'development')
            res.setHeader('x-reset-token', raw);
    }
    res.json({ message: 'If that account exists, reset instructions have been sent.' });
}
catch (e) {
    next(e);
} });
router.post('/reset-password', async (req, res, next) => { try {
    const { token, password } = z.object({ token: z.string().min(20), password: z.string().min(12).regex(/[A-Z]/).regex(/[a-z]/).regex(/[0-9]/) }).parse(req.body);
    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hash(token) } });
    if (!record || record.usedAt || record.expiresAt < new Date())
        throw new AppError(400, 'Reset token is invalid or expired', 'INVALID_RESET_TOKEN');
    await prisma.$transaction([prisma.user.update({ where: { email: record.email }, data: { passwordHash: await bcrypt.hash(password, 12) } }), prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }), prisma.refreshToken.updateMany({ where: { user: { email: record.email } }, data: { revokedAt: new Date() } })]);
    res.json({ message: 'Password reset successfully' });
}
catch (e) {
    next(e);
} });
export default router;

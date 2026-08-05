import { Router } from 'express';
import { z } from 'zod';
import multer from 'multer';
import crypto from 'node:crypto';
import path from 'node:path';
import { prisma } from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { AppError } from '../lib/errors.js';
const router = Router(), upload = multer({ storage: multer.diskStorage({ destination: 'uploads', filename: (_r, f, cb) => cb(null, `${crypto.randomUUID()}${path.extname(f.originalname).toLowerCase()}`) }), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (_r, f, cb) => cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(f.mimetype)) });
router.use(authenticate);
router.get('/', async (req, res, next) => { try {
    const result = await prisma.user.findUnique({ where: { id: req.auth.userId }, select: { id: true, email: true, role: { select: { name: true } }, employee: { select: { id: true, firstName: true, lastName: true, phone: true, officeLocation: true, avatarUrl: true, designation: true, employeeNumber: true, department: { select: { name: true } }, manager: { select: { firstName: true, lastName: true } } } } } });
    if (!result)
        throw new AppError(404, 'Profile not found');
    res.json(result);
}
catch (e) {
    next(e);
} });
router.patch('/', async (req, res, next) => { try {
    const input = z.object({ firstName: z.string().min(2).max(80).optional(), lastName: z.string().min(2).max(80).optional(), phone: z.string().max(30).optional(), officeLocation: z.string().max(120).optional() }).parse(req.body);
    res.json(await prisma.employee.update({ where: { userId: req.auth.userId }, data: input, select: { firstName: true, lastName: true, phone: true, officeLocation: true, avatarUrl: true, designation: true, employeeNumber: true } }));
}
catch (e) {
    next(e);
} });
router.post('/avatar', upload.single('avatar'), async (req, res, next) => { try {
    if (!req.file)
        throw new AppError(422, 'A JPEG, PNG, or WebP image is required');
    const avatarUrl = `/uploads/${req.file.filename}`;
    await prisma.employee.update({ where: { userId: req.auth.userId }, data: { avatarUrl } });
    res.status(201).json({ avatarUrl });
}
catch (e) {
    next(e);
} });
export default router;

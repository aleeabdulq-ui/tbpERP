import { Router } from 'express';
import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { existsSync, mkdirSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { LeaveStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { AppError } from '../lib/errors.js';
import { protectedValue } from '../lib/sensitive-data.js';
import { hasPermission } from '../lib/access-control.js';
import { confidentialEmployeeFields } from '../lib/hr-record.js';
import { calculateLeaveSchedule } from '../lib/leave-calendar.js';
const router = Router();
router.use(authenticate);
const employeeImageDirectory = resolve('uploads', 'employees');
const employeeSignatureDirectory = resolve('private_uploads', 'employee-signatures');
const imageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
const imageUpload = (directory, limit) => multer({
    storage: multer.diskStorage({
        destination: (_request, _file, callback) => { mkdirSync(directory, { recursive: true }); callback(null, directory); },
        filename: (_request, file, callback) => callback(null, `${crypto.randomUUID()}${extname(file.originalname).toLowerCase()}`),
    }),
    limits: { fileSize: limit },
    fileFilter: (_request, file, callback) => callback(null, imageTypes.has(file.mimetype)),
});
const employeePhotoUpload = imageUpload(employeeImageDirectory, 5 * 1024 * 1024);
const employeeSignatureUpload = imageUpload(employeeSignatureDirectory, 2 * 1024 * 1024);
const employeeId = async (userId) => (await prisma.employee.findUniqueOrThrow({ where: { userId }, select: { id: true } })).id;
const pageQuery = z.object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
    search: z.string().trim().max(100).optional(),
    departmentId: z.coerce.number().int().positive().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']).optional(),
    sort: z.enum(['name', 'joined', 'recent']).default('name'),
});
const optionalText = (max = 500) => z.preprocess(value => value === '' ? undefined : value, z.string().trim().max(max).optional());
const optionalDate = z.preprocess(value => value === '' ? undefined : value, z.coerce.date().optional());
const optionalDigits = (length, label) => z.preprocess(value => value === '' ? undefined : value, z.string().regex(new RegExp(`^\\d{${length}}$`), `${label} must contain exactly ${length} digits`).optional());
const employeeCreateSchema = z.object({
    email: z.string().email().transform(value => value.toLowerCase()),
    employeeNumber: z.string().trim().min(3).max(30),
    firstName: z.string().trim().min(2).max(80),
    middleName: optionalText(80),
    lastName: z.string().trim().min(2).max(80),
    preferredName: optionalText(120),
    dateOfBirth: optionalDate,
    gender: z.preprocess(value => value === '' ? undefined : value, z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']).optional()),
    maritalStatus: z.preprocess(value => value === '' ? undefined : value, z.enum(['SINGLE', 'MARRIED', 'DIVORCED', 'WIDOWED']).optional()),
    nationality: optionalText(80),
    residentialAddress: optionalText(500),
    permanentAddress: optionalText(500),
    phone: z.string().trim().max(40).optional(),
    alternatePhone: optionalText(40),
    nin: optionalDigits(11, 'NIN'),
    bvn: optionalDigits(11, 'BVN'),
    idCardType: z.preprocess(value => value === '' ? undefined : value, z.enum(['NATIONAL_ID', 'DRIVERS_LICENSE', 'PASSPORT', 'VOTERS_CARD', 'OTHER']).optional()),
    idCardNumber: optionalText(80),
    passportNumber: optionalText(40),
    taxIdentificationNumber: optionalText(60),
    workPermitStatus: optionalText(240),
    documentCopiesAttached: z.boolean().default(false),
    emergencyContactName: optionalText(160),
    emergencyRelationship: optionalText(80),
    emergencyPhone: optionalText(40),
    emergencyAddress: optionalText(500),
    designation: z.string().trim().min(2).max(120),
    departmentId: z.number().int().positive(),
    supervisorName: optionalText(160),
    joinedAt: z.coerce.date(),
    employmentType: z.enum(['FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP']).optional(),
    workLocation: z.enum(['OFFICE', 'REMOTE', 'HYBRID']).optional(),
    officeLocation: z.string().trim().min(2).max(120),
    probationPeriod: optionalText(80),
    expectedConfirmationDate: optionalDate,
    bankName: optionalText(120),
    accountNumber: optionalDigits(10, 'Account number'),
    accountType: z.enum(['SAVINGS', 'CURRENT']).optional(),
    salaryStructure: optionalText(240),
    allowances: optionalText(500),
    deductions: optionalText(500),
    overtimeEligible: z.boolean().default(false),
    healthInsuranceProvider: optionalText(160),
    pensionEnrolled: z.boolean().default(false),
    accommodationNeeds: optionalText(500),
    nextOfKin: optionalText(160),
    backgroundCheckConsent: z.boolean().default(false),
    policyAcknowledged: z.boolean().default(false),
    highestQualification: optionalText(160),
    institution: optionalText(200),
    graduationYear: z.preprocess(value => value === '' ? undefined : value, z.coerce.number().int().min(1950).max(2100).optional()),
    professionalCertifications: optionalText(1000),
    employmentHistory: z.array(z.object({
        companyName: z.string().trim().min(2).max(200),
        positionHeld: z.string().trim().min(2).max(160),
        startedAt: optionalDate,
        endedAt: optionalDate,
        reasonForLeaving: optionalText(500),
    })).max(10).default([]),
    nonCompeteSigned: z.boolean().default(false),
    confidentialitySigned: z.boolean().default(false),
    dataPrivacyConsent: z.boolean().default(false),
    handbookReceived: z.boolean().default(false),
    employeeSignature: optionalText(160),
    employeeSignatureDate: optionalDate,
    hrRepresentativeSignature: optionalText(160),
    hrSignatureDate: optionalDate,
});
const employeeUpdateSchema = employeeCreateSchema.extend({
    status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED']),
});
const paymentSchema = z.object({
    grossPay: z.coerce.number().finite().min(0).max(9999999999999),
    tax: z.preprocess(value => value === '' || value === undefined ? 0 : value, z.coerce.number().finite().min(0).max(9999999999999)),
    deductions: z.preprocess(value => value === '' || value === undefined ? 0 : value, z.coerce.number().finite().min(0).max(9999999999999)),
    ratePerHour: z.coerce.number().finite().min(0).max(9999999999999),
    currency: z.string().trim().toUpperCase().regex(/^[A-Z]{3}$/, 'Currency must be a three-letter ISO code').default('NGN'),
    effectiveAt: z.coerce.date(),
}).superRefine((value, context) => {
    if (value.tax + value.deductions > value.grossPay)
        context.addIssue({ code: z.ZodIssueCode.custom, path: ['deductions'], message: 'Tax and deductions cannot exceed gross pay' });
});
const serializePayment = (record) => ({
    id: record.id,
    grossPay: Number(record.grossPay), tax: Number(record.tax), deductions: Number(record.deductions), netPay: Number(record.netPay), ratePerHour: Number(record.ratePerHour),
    currency: record.currency, effectiveAt: record.effectiveAt, createdAt: record.createdAt, updatedAt: record.updatedAt,
    updatedBy: record.updatedBy.employee ? `${record.updatedBy.employee.firstName} ${record.updatedBy.employee.lastName}` : record.updatedBy.email,
});
router.get('/employees', authorize('employees:read'), async (req, res, next) => {
    try {
        const query = pageQuery.parse(req.query);
        const where = { deletedAt: null };
        if (query.departmentId)
            where.departmentId = query.departmentId;
        if (query.status)
            where.status = query.status;
        if (query.search)
            where.OR = [
                { firstName: { contains: query.search } },
                { lastName: { contains: query.search } },
                { employeeNumber: { contains: query.search } },
                { designation: { contains: query.search } },
                { user: { email: { contains: query.search } } },
            ];
        const orderBy = query.sort === 'joined' ? [{ joinedAt: 'asc' }] : query.sort === 'recent' ? [{ createdAt: 'desc' }] : [{ firstName: 'asc' }, { lastName: 'asc' }];
        const [employees, total, active, onLeave, departments, departmentOptions] = await Promise.all([
            prisma.employee.findMany({
                where, orderBy, skip: (query.page - 1) * query.pageSize, take: query.pageSize,
                include: { department: true, user: { select: { email: true, role: { select: { name: true } } } }, manager: { select: { id: true, firstName: true, lastName: true, designation: true } } },
            }),
            prisma.employee.count({ where }),
            prisma.employee.count({ where: { deletedAt: null, status: 'ACTIVE' } }),
            prisma.employee.count({ where: { deletedAt: null, status: 'ON_LEAVE' } }),
            prisma.department.count({ where: { deletedAt: null } }),
            prisma.department.findMany({ where: { deletedAt: null }, select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } }),
        ]);
        res.json({
            data: employees.map(e => ({ id: e.id, employeeNumber: e.employeeNumber, name: `${e.firstName} ${e.lastName}`, firstName: e.firstName, lastName: e.lastName, email: e.user.email, role: e.user.role.name, phone: e.phone, avatarUrl: e.avatarUrl, designation: e.designation, status: e.status, joinedAt: e.joinedAt, officeLocation: e.officeLocation, department: e.department, manager: e.manager ? { id: e.manager.id, name: `${e.manager.firstName} ${e.manager.lastName}`, designation: e.manager.designation } : null })),
            pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.max(Math.ceil(total / query.pageSize), 1) },
            summary: { total: await prisma.employee.count({ where: { deletedAt: null } }), active, onLeave, departments },
            departments: departmentOptions,
            capabilities: {
                manage: hasPermission(req.auth, 'employees:manage'),
                editRecords: hasPermission(req.auth, 'employees:manage') && hasPermission(req.auth, 'staff_records:manage'),
                viewPayment: hasPermission(req.auth, 'payment_structure:read') || hasPermission(req.auth, 'hourly_rate:read'),
                managePayment: hasPermission(req.auth, 'payment_structure:manage'),
            },
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/employees', authorize('employees:manage'), async (req, res, next) => {
    try {
        const input = employeeCreateSchema.parse(req.body);
        const { email, employeeNumber, firstName, lastName, phone, designation, departmentId, joinedAt, officeLocation, employmentHistory, nin, bvn, accountNumber, ...profile } = input;
        const hrProfile = {
            ...profile,
            dateOfBirth: profile.dateOfBirth?.toISOString(),
            expectedConfirmationDate: profile.expectedConfirmationDate?.toISOString(),
            employeeSignatureDate: profile.employeeSignatureDate?.toISOString(),
            hrSignatureDate: profile.hrSignatureDate?.toISOString(),
            nin: protectedValue(nin),
            bvn: protectedValue(bvn),
            accountNumber: protectedValue(accountNumber),
        };
        const employeeRole = await prisma.role.findUnique({ where: { name: 'Employee' } });
        if (!employeeRole)
            throw new AppError(500, 'Employee role is not configured', 'ROLE_NOT_CONFIGURED');
        const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('base64url'), 12);
        const employee = await prisma.$transaction(async (transaction) => {
            const user = await transaction.user.create({ data: { email, passwordHash, roleId: employeeRole.id } });
            return transaction.employee.create({
                data: {
                    userId: user.id, employeeNumber, firstName, lastName, designation, departmentId, joinedAt, officeLocation, phone, hrProfile,
                    employmentHistory: { create: employmentHistory.map(item => ({ companyName: item.companyName, positionHeld: item.positionHeld, startedAt: item.startedAt, endedAt: item.endedAt, reasonForLeaving: item.reasonForLeaving })) },
                },
                select: { id: true, employeeNumber: true, firstName: true, lastName: true, designation: true, department: true, user: { select: { email: true } } },
            });
        });
        res.status(201).json({ employee, inviteRequired: true, message: 'Employee created. Ask them to use Forgot Password to activate their account.' });
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            return next(new AppError(409, 'Email or employee number already exists', 'EMPLOYEE_EXISTS'));
        next(error);
    }
});
router.patch('/employees/:id', authorize('employees:manage'), authorize('staff_records:manage'), async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id);
        const input = employeeUpdateSchema.parse(req.body);
        const current = await prisma.employee.findFirst({ where: { id, deletedAt: null }, select: { id: true, userId: true, hrProfile: true } });
        if (!current)
            throw new AppError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
        const { email, employeeNumber, firstName, lastName, phone, designation, departmentId, joinedAt, officeLocation, employmentHistory, nin, bvn, accountNumber, status, ...profile } = input;
        const previousProfile = current.hrProfile && typeof current.hrProfile === 'object' && !Array.isArray(current.hrProfile) ? current.hrProfile : {};
        const profileRecord = {
            ...profile,
            dateOfBirth: profile.dateOfBirth?.toISOString(),
            expectedConfirmationDate: profile.expectedConfirmationDate?.toISOString(),
            employeeSignatureDate: profile.employeeSignatureDate?.toISOString(),
            hrSignatureDate: profile.hrSignatureDate?.toISOString(),
            nin: nin ? protectedValue(nin) : previousProfile.nin,
            bvn: bvn ? protectedValue(bvn) : previousProfile.bvn,
            accountNumber: accountNumber ? protectedValue(accountNumber) : previousProfile.accountNumber,
        };
        const hrProfile = JSON.parse(JSON.stringify(profileRecord));
        const employee = await prisma.$transaction(async (transaction) => {
            await transaction.user.update({ where: { id: current.userId }, data: { email } });
            await transaction.employmentHistory.deleteMany({ where: { employeeId: id } });
            const updated = await transaction.employee.update({
                where: { id },
                data: {
                    employeeNumber, firstName, lastName, phone: phone || null, designation, departmentId, joinedAt, officeLocation, status, hrProfile,
                    employmentHistory: { create: employmentHistory.map(item => ({ companyName: item.companyName, positionHeld: item.positionHeld, startedAt: item.startedAt, endedAt: item.endedAt, reasonForLeaving: item.reasonForLeaving })) },
                },
                select: { id: true, employeeNumber: true, firstName: true, lastName: true, phone: true, designation: true, status: true, joinedAt: true, officeLocation: true, department: true, user: { select: { email: true } } },
            });
            await transaction.auditLog.create({ data: { userId: req.auth.userId, action: 'EMPLOYEE_RECORD_UPDATED', entityType: 'EMPLOYEE', entityId: String(id), metadata: { employeeNumber, fields: ['identity', 'contact', 'employment', 'hrProfile', 'employmentHistory'] } } });
            return updated;
        });
        res.json({ employee, message: 'Employee record saved successfully.' });
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002')
            return next(new AppError(409, 'Email or employee number already exists', 'EMPLOYEE_EXISTS'));
        next(error);
    }
});
router.post('/employees/:id/avatar', authorize('employees:manage'), authorize('staff_records:manage'), employeePhotoUpload.single('image'), async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id);
        if (!req.file)
            throw new AppError(422, 'Choose a JPEG, PNG, or WebP employee image', 'EMPLOYEE_IMAGE_REQUIRED');
        const avatarUrl = `/uploads/employees/${req.file.filename}`;
        const employee = await prisma.employee.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
        if (!employee)
            throw new AppError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
        await prisma.$transaction([
            prisma.employee.update({ where: { id }, data: { avatarUrl } }),
            prisma.auditLog.create({ data: { userId: req.auth.userId, action: 'EMPLOYEE_IMAGE_UPDATED', entityType: 'EMPLOYEE', entityId: String(id) } }),
        ]);
        res.status(201).json({ avatarUrl, message: 'Employee image uploaded successfully.' });
    }
    catch (error) {
        next(error);
    }
});
router.post('/employees/:id/signature', authorize('employees:manage'), authorize('staff_records:manage'), employeeSignatureUpload.single('signature'), async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id);
        if (!req.file)
            throw new AppError(422, 'Choose a JPEG, PNG, or WebP signature image', 'EMPLOYEE_SIGNATURE_REQUIRED');
        const employee = await prisma.employee.findFirst({ where: { id, deletedAt: null }, select: { id: true } });
        if (!employee)
            throw new AppError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
        await prisma.$transaction([
            prisma.employee.update({ where: { id }, data: { signatureFileName: req.file.filename } }),
            prisma.auditLog.create({ data: { userId: req.auth.userId, action: 'EMPLOYEE_SIGNATURE_UPDATED', entityType: 'EMPLOYEE', entityId: String(id) } }),
        ]);
        res.status(201).json({ signatureUrl: `/api/v1/hr/employees/${id}/signature`, message: 'Employee signature uploaded successfully.' });
    }
    catch (error) {
        next(error);
    }
});
router.get('/employees/:id/signature', authorize('employees:read'), authorize('staff_records:manage'), async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id);
        const employee = await prisma.employee.findFirst({ where: { id, deletedAt: null }, select: { signatureFileName: true } });
        if (!employee?.signatureFileName)
            throw new AppError(404, 'Employee signature not found', 'SIGNATURE_NOT_FOUND');
        const signaturePath = resolve(employeeSignatureDirectory, employee.signatureFileName);
        if (!existsSync(signaturePath))
            throw new AppError(404, 'Employee signature file not found', 'SIGNATURE_FILE_NOT_FOUND');
        res.setHeader('Cache-Control', 'private, max-age=300');
        res.sendFile(signaturePath);
    }
    catch (error) {
        next(error);
    }
});
router.get('/employees/:id', authorize('employees:read'), async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id);
        const employee = await prisma.employee.findFirst({
            where: { id, deletedAt: null },
            select: {
                id: true, employeeNumber: true, firstName: true, lastName: true, phone: true, avatarUrl: true, signatureFileName: true, designation: true, status: true, joinedAt: true, officeLocation: true, createdAt: true, updatedAt: true,
                hrProfile: true,
                department: { select: { id: true, name: true, code: true } },
                user: { select: { email: true, role: { select: { name: true } } } },
                manager: { select: { id: true, employeeNumber: true, firstName: true, lastName: true, avatarUrl: true, designation: true, status: true, department: { select: { id: true, name: true, code: true } } } },
                employmentHistory: { select: { id: true, companyName: true, positionHeld: true, startedAt: true, endedAt: true, reasonForLeaving: true }, orderBy: { startedAt: 'desc' } },
            },
        });
        if (!employee)
            throw new AppError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
        const canViewStaffRecord = hasPermission(req.auth, 'staff_records:manage');
        const canEditStaffRecord = canViewStaffRecord && hasPermission(req.auth, 'employees:manage');
        const { hrProfile, signatureFileName, ...directoryRecord } = employee;
        res.json({ ...directoryRecord, ...confidentialEmployeeFields(hrProfile, canViewStaffRecord), ...(canViewStaffRecord && signatureFileName ? { signatureUrl: `/api/v1/hr/employees/${id}/signature` } : {}), capabilities: { viewConfidential: canViewStaffRecord, edit: canEditStaffRecord } });
    }
    catch (error) {
        next(error);
    }
});
router.get('/employees/:id/payment-structure', async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id);
        const target = await prisma.employee.findFirst({ where: { id, deletedAt: null }, select: { id: true, userId: true } });
        if (!target)
            throw new AppError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
        const canReadAll = hasPermission(req.auth, 'payment_structure:read');
        const canReadRate = hasPermission(req.auth, 'hourly_rate:read');
        const canReadOwnNet = target.userId === req.auth.userId && hasPermission(req.auth, 'own_net_pay:read');
        if (!canReadAll && !canReadRate && !canReadOwnNet)
            throw new AppError(403, 'You do not have permission to view payment information', 'FORBIDDEN');
        const records = await prisma.staffPayment.findMany({
            where: { employeeId: id }, orderBy: [{ effectiveAt: 'desc' }, { createdAt: 'desc' }],
            include: { updatedBy: { select: { email: true, employee: { select: { firstName: true, lastName: true } } } } },
        });
        const data = records.map(serializePayment).map(record => canReadAll ? record : canReadRate ? ({ id: record.id, ratePerHour: record.ratePerHour, currency: record.currency, effectiveAt: record.effectiveAt }) : ({ id: record.id, netPay: record.netPay, currency: record.currency, effectiveAt: record.effectiveAt }));
        res.json({ data, workingSchedule: { workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], daysPerWeek: 5, hoursPerDay: 9, startTime: '08:00', endTime: '17:00', weeklyHours: 45, averageMonthlyHours: 195 }, capabilities: { viewAll: canReadAll, viewRate: canReadAll || canReadRate, viewNet: canReadAll || canReadOwnNet, manage: hasPermission(req.auth, 'payment_structure:manage') } });
    }
    catch (error) {
        next(error);
    }
});
router.post('/employees/:id/payment-structure', authorize('payment_structure:manage'), async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id);
        const input = paymentSchema.parse(req.body);
        if (!await prisma.employee.findFirst({ where: { id, deletedAt: null }, select: { id: true } }))
            throw new AppError(404, 'Employee not found', 'EMPLOYEE_NOT_FOUND');
        const netPay = input.grossPay - input.tax - input.deductions;
        const record = await prisma.$transaction(async (transaction) => {
            const created = await transaction.staffPayment.create({ data: { employeeId: id, ...input, netPay, updatedById: req.auth.userId }, include: { updatedBy: { select: { email: true, employee: { select: { firstName: true, lastName: true } } } } } });
            await transaction.auditLog.create({ data: { userId: req.auth.userId, action: 'STAFF_PAYMENT_CREATED', entityType: 'STAFF_PAYMENT', entityId: String(created.id), metadata: { employeeId: id, effectiveAt: input.effectiveAt.toISOString(), currency: input.currency } } });
            return created;
        });
        res.status(201).json({ payment: serializePayment(record), message: 'Payment structure saved. Previous records were retained.' });
    }
    catch (error) {
        next(error);
    }
});
const leaveQuery = z.object({
    scope: z.enum(['mine', 'team']).default('mine'),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(50).default(10),
    status: z.nativeEnum(LeaveStatus).optional(),
    search: z.string().trim().max(100).optional(),
});
const leaveDatesSchema = z.object({ startDate: z.coerce.date(), endDate: z.coerce.date() }).refine(value => value.endDate >= value.startDate, { message: 'End date must be on or after the start date' });
const loadLeaveSchedule = async (startDate, endDate) => calculateLeaveSchedule(startDate, endDate, await prisma.publicHoliday.findMany({ select: { name: true, date: true, recurring: true } }));
router.get('/leave/holidays', authorize('leave:read'), async (_req, res, next) => {
    try {
        res.json(await prisma.publicHoliday.findMany({ orderBy: { date: 'asc' } }));
    }
    catch (error) {
        next(error);
    }
});
router.post('/leave/preview', authorize('leave:read'), async (req, res, next) => {
    try {
        const input = leaveDatesSchema.parse(req.body);
        const schedule = await loadLeaveSchedule(input.startDate, input.endDate);
        if (!schedule.days)
            throw new AppError(422, 'The selected period does not contain a working day', 'NO_WORKING_DAYS');
        res.json(schedule);
    }
    catch (error) {
        next(error);
    }
});
router.get('/leave', authorize('leave:read'), async (req, res, next) => {
    try {
        const query = leaveQuery.parse(req.query);
        const ownEmployeeId = await employeeId(req.auth.userId);
        const canApprove = hasPermission(req.auth, 'leave:approve');
        if (query.scope === 'team' && !canApprove)
            throw new AppError(403, 'You do not have permission to view team approvals', 'FORBIDDEN');
        const where = { deletedAt: null, ...(query.scope === 'mine' ? { employeeId: ownEmployeeId } : { employeeId: { not: ownEmployeeId } }) };
        if (query.status)
            where.status = query.status;
        if (query.search)
            where.employee = { OR: [{ firstName: { contains: query.search } }, { lastName: { contains: query.search } }, { employeeNumber: { contains: query.search } }] };
        const [requests, total, mine, teamPending] = await Promise.all([
            prisma.leaveRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, include: { employee: { include: { department: true, user: { select: { email: true } } } } } }),
            prisma.leaveRequest.count({ where }),
            prisma.leaveRequest.findMany({ where: { employeeId: ownEmployeeId, deletedAt: null } }),
            canApprove ? prisma.leaveRequest.count({ where: { status: 'PENDING', deletedAt: null, employeeId: { not: ownEmployeeId } } }) : Promise.resolve(0),
        ]);
        const approvedDays = mine.filter(r => r.status === 'APPROVED').reduce((sum, r) => sum + Number(r.days), 0);
        const pendingDays = mine.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + Number(r.days), 0);
        res.json({
            data: requests.map(r => ({ ...r, days: Number(r.days), employee: { id: r.employee.id, name: `${r.employee.firstName} ${r.employee.lastName}`, employeeNumber: r.employee.employeeNumber, designation: r.employee.designation, email: r.employee.user.email, department: r.employee.department.name, avatarUrl: r.employee.avatarUrl } })),
            pagination: { page: query.page, pageSize: query.pageSize, total, pages: Math.max(Math.ceil(total / query.pageSize), 1) },
            summary: { balance: Math.max(25 - approvedDays, 0), used: approvedDays, pending: pendingDays, teamPending },
            capabilities: { approve: canApprove },
        });
    }
    catch (error) {
        next(error);
    }
});
router.post('/leave', authorize('leave:create'), async (req, res, next) => {
    try {
        const data = z.object({ type: z.enum(['Annual Leave', 'Sick Leave', 'Casual Leave', 'Compassionate Leave']), startDate: z.coerce.date(), endDate: z.coerce.date(), reason: z.string().trim().min(5).max(500) }).parse(req.body);
        if (data.endDate < data.startDate)
            throw new AppError(422, 'End date must be on or after the start date', 'INVALID_DATE_RANGE');
        const schedule = await loadLeaveSchedule(data.startDate, data.endDate);
        if (!schedule.days)
            throw new AppError(422, 'The selected period does not contain a working day', 'NO_WORKING_DAYS');
        const request = await prisma.leaveRequest.create({ data: { type: data.type, startDate: data.startDate, requestedEndDate: data.endDate, endDate: schedule.effectiveEndDate, days: schedule.days, excludedHolidayCount: schedule.excludedHolidayCount, reason: data.reason, employeeId: await employeeId(req.auth.userId) } });
        res.status(201).json({ ...request, days: Number(request.days) });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/leave/:id/review', authorize('leave:approve'), async (req, res, next) => {
    try {
        const id = z.coerce.number().int().positive().parse(req.params.id);
        const input = z.object({ status: z.enum(['APPROVED', 'REJECTED']), reviewerNote: z.string().trim().max(500).optional() }).parse(req.body);
        const reviewerEmployeeId = await employeeId(req.auth.userId);
        const request = await prisma.leaveRequest.findFirst({ where: { id, deletedAt: null } });
        if (!request)
            throw new AppError(404, 'Leave request not found', 'LEAVE_NOT_FOUND');
        if (request.employeeId === reviewerEmployeeId)
            throw new AppError(409, 'You cannot review your own leave request', 'SELF_APPROVAL_NOT_ALLOWED');
        if (request.status !== 'PENDING')
            throw new AppError(409, 'Only pending leave requests can be reviewed', 'LEAVE_ALREADY_REVIEWED');
        const updated = await prisma.leaveRequest.update({ where: { id }, data: { ...input, reviewedById: req.auth.userId, reviewedAt: new Date() } });
        await prisma.notification.create({ data: { userId: (await prisma.employee.findUniqueOrThrow({ where: { id: request.employeeId }, select: { userId: true } })).userId, type: 'LEAVE', title: `Leave ${input.status.toLowerCase()}`, message: `Your ${request.type} request has been ${input.status.toLowerCase()}.` } });
        res.json({ ...updated, days: Number(updated.days) });
    }
    catch (error) {
        next(error);
    }
});
router.get('/payroll', authorize('payroll:read'), async (req, res, next) => { try {
    res.json(await prisma.payroll.findMany({ where: { employeeId: await employeeId(req.auth.userId), deletedAt: null }, orderBy: { period: 'desc' } }));
}
catch (error) {
    next(error);
} });
router.get('/benefits', authorize('benefits:read'), async (req, res, next) => { try {
    res.json(await prisma.employeeBenefit.findMany({ where: { employeeId: await employeeId(req.auth.userId) }, include: { benefit: true } }));
}
catch (error) {
    next(error);
} });
router.get('/training', authorize('training:read'), async (req, res, next) => {
    try {
        const manage = hasPermission(req.auth, 'training:manage');
        const programs = await prisma.training.findMany({
            where: { deletedAt: null }, orderBy: [{ status: 'asc' }, { startsAt: 'asc' }],
            include: { employees: { ...(manage ? {} : { where: { employeeId: await employeeId(req.auth.userId) } }), include: { employee: { select: { id: true, firstName: true, lastName: true, employeeNumber: true, avatarUrl: true, department: { select: { name: true } } } } } } },
        });
        const visible = manage ? programs : programs.filter(program => program.employees.length);
        res.json({ data: visible.map(program => ({ ...program, enrollments: program.employees.map(enrollment => ({ ...enrollment, employee: { ...enrollment.employee, name: `${enrollment.employee.firstName} ${enrollment.employee.lastName}` } })), averageProgress: program.employees.length ? Math.round(program.employees.reduce((sum, item) => sum + item.progress, 0) / program.employees.length) : 0 })), capabilities: { manage } });
    }
    catch (error) {
        next(error);
    }
});
const trainingSchema = z.object({ title: z.string().trim().min(2).max(160), description: z.string().trim().max(2000).optional(), category: z.string().trim().min(2).max(80), deliveryMode: z.enum(['IN_PERSON', 'ONLINE', 'HYBRID']), status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).default('DRAFT'), startsAt: z.coerce.date().optional(), endsAt: z.coerce.date().optional(), certificationName: z.string().trim().max(160).optional(), performanceGoal: z.string().trim().max(500).optional() });
router.post('/training', authorize('training:manage'), async (req, res, next) => {
    try {
        const input = trainingSchema.parse(req.body);
        const training = await prisma.training.create({ data: input });
        await prisma.auditLog.create({ data: { userId: req.auth.userId, action: 'TRAINING_CREATED', entityType: 'TRAINING', entityId: String(training.id) } });
        res.status(201).json(training);
    }
    catch (error) {
        next(error);
    }
});
router.post('/training/:id/enroll', authorize('training:manage'), async (req, res, next) => {
    try {
        const trainingId = z.coerce.number().int().positive().parse(req.params.id);
        const { employeeIds } = z.object({ employeeIds: z.array(z.number().int().positive()).min(1) }).parse(req.body);
        await prisma.employeeTraining.createMany({ data: employeeIds.map(id => ({ trainingId, employeeId: id, status: 'ASSIGNED' })), skipDuplicates: true });
        res.status(201).json({ enrolled: employeeIds.length });
    }
    catch (error) {
        next(error);
    }
});
router.patch('/training/:trainingId/employees/:employeeId', authorize('training:manage'), async (req, res, next) => {
    try {
        const trainingId = z.coerce.number().int().positive().parse(req.params.trainingId), targetEmployeeId = z.coerce.number().int().positive().parse(req.params.employeeId);
        const input = z.object({ progress: z.number().int().min(0).max(100), status: z.enum(['ASSIGNED', 'IN_PROGRESS', 'COMPLETED']), certificateNumber: z.string().trim().max(160).optional(), certificationUrl: z.string().url().max(500).optional(), expiresAt: z.coerce.date().optional(), notes: z.string().trim().max(1000).optional() }).parse(req.body);
        const updated = await prisma.employeeTraining.update({ where: { employeeId_trainingId: { employeeId: targetEmployeeId, trainingId } }, data: { ...input, completedAt: input.status === 'COMPLETED' ? new Date() : null } });
        res.json(updated);
    }
    catch (error) {
        next(error);
    }
});
export default router;

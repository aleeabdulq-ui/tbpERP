import type { NextFunction,Request,Response } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError } from '../lib/errors.js';
type Payload={sub:string;role:string;permissions:string[]};
export function authenticate(req:Request,_res:Response,next:NextFunction){const raw=req.headers.authorization;if(!raw?.startsWith('Bearer '))return next(new AppError(401,'Authentication required','UNAUTHENTICATED'));try{const p=jwt.verify(raw.slice(7),config.JWT_ACCESS_SECRET) as Payload;req.auth={userId:Number(p.sub),role:p.role,permissions:p.permissions};next()}catch{next(new AppError(401,'Access token is invalid or expired','INVALID_TOKEN'))}}
export const authorize=(...permissions:string[])=>(req:Request,_res:Response,next:NextFunction)=>{if(!req.auth)return next(new AppError(401,'Authentication required'));if(req.auth.permissions.includes('*')||permissions.some(p=>req.auth!.permissions.includes(p)))return next();next(new AppError(403,'You do not have permission to perform this action','FORBIDDEN'))};

import type { NextFunction,Request,Response } from 'express';
import { ZodError } from 'zod'; import { AppError } from '../lib/errors.js';
export function notFound(req:Request,res:Response){res.status(404).json({error:{code:'NOT_FOUND',message:`Route ${req.method} ${req.path} was not found`}})}
export function errorHandler(err:unknown,_req:Request,res:Response,_next:NextFunction){if(err instanceof ZodError)return res.status(422).json({error:{code:'VALIDATION_ERROR',message:'The request is invalid',details:err.flatten()}});if(err instanceof AppError)return res.status(err.status).json({error:{code:err.code,message:err.message}});console.error(err);res.status(500).json({error:{code:'INTERNAL_ERROR',message:'An unexpected error occurred'}})}

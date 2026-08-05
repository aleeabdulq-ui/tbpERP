import { z } from 'zod';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';

const cwd = process.cwd();
const envPath = cwd.endsWith(path.join('apps', 'api'))
  ? path.resolve(cwd, '..', '..', '.env')
  : path.resolve(cwd, '.env');

loadEnv({ path: envPath });
const schema=z.object({NODE_ENV:z.enum(['development','test','production']).default('development'),PORT:z.coerce.number().default(4000),WEB_ORIGIN:z.string().url().default('http://localhost:5173'),JWT_ACCESS_SECRET:z.string().min(32),JWT_REFRESH_SECRET:z.string().min(32),DATA_ENCRYPTION_KEY:z.string().min(32).optional(),ACCESS_TOKEN_TTL:z.string().default('15m'),REFRESH_TOKEN_DAYS:z.coerce.number().default(7),COOKIE_SECURE:z.string().default('false').transform(v=>v==='true')});
export const config=schema.parse(process.env);

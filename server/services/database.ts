import '../config/env.js';
import { PrismaClient } from '@prisma/client';

export function createDatabase(url = process.env.DATABASE_URL): PrismaClient {
    if (!url) throw new Error('DATABASE_URL is required. See server/.env.example.');
    return new PrismaClient({ datasources: { db: { url } } });
}

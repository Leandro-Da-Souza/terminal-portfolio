import '../config/env.js';
import AdminJS from 'adminjs';
import { buildAuthenticatedRouter } from '@adminjs/express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import pg from 'pg';
import express from 'express';
import rateLimit from 'express-rate-limit';
import type { PrismaClient } from '@prisma/client';
import type { ContentService } from '../services/content.js';
import { contentResources } from './resources.js';
import { isPasswordHash, verifyPassword } from './password.js';

export type AdminConfig = {
    email: string;
    passwordHash: string;
    secret: string;
    origin: string;
    secure: boolean;
};
export function adminConfigFromEnv(): AdminConfig {
    const email = process.env.ADMIN_EMAIL ?? '';
    const passwordHash = process.env.ADMIN_PASSWORD_HASH ?? '';
    const secret = process.env.ADMIN_SESSION_SECRET ?? '';
    const secure = process.env.NODE_ENV === 'production';
    let origin = '';
    try {
        const url = new URL(process.env.ADMIN_ORIGIN ?? '');
        if (url.pathname !== '/' || url.search || url.hash) throw new Error();
        origin = url.origin;
    } catch {
        /* handled below */
    }
    if (
        !email.includes('@') ||
        !isPasswordHash(passwordHash) ||
        secret.length < 32 ||
        !origin ||
        (secure && !origin.startsWith('https://'))
    ) {
        throw new Error(
            'Configure ADMIN_EMAIL, ADMIN_PASSWORD_HASH, ADMIN_SESSION_SECRET (32+ characters), and ADMIN_ORIGIN (HTTPS in production). See server/.env.example.'
        );
    }
    return { email, passwordHash, secret, origin, secure };
}

export async function createAdmin(
    db: PrismaClient,
    content: ContentService,
    databaseUrl: string,
    config: AdminConfig
) {
    const pool = new pg.Pool({
        connectionString: databaseUrl,
        max: 2,
        connectionTimeoutMillis: 5_000,
    });
    pool.on('error', () => console.error('Admin session database connection failed.'));
    const Store = connectPgSimple(session);
    const store = new Store({
        pool,
        schemaName: new URL(databaseUrl).searchParams.get('schema') ?? 'public',
        tableName: 'admin_session',
        createTableIfMissing: false,
        errorLog: () => console.error('Admin session storage failed.'),
    });
    const admin = new AdminJS({
        rootPath: '/admin',
        resources: contentResources(db, content),
        branding: { companyName: 'Portfolio editor', withMadeWithLove: false },
    });
    // Wait for assets before accepting requests; use a non-hidden output directory for Express 5.
    const initialize = admin.initialize.bind(admin);
    let initialization: Promise<void> | undefined;
    admin.initialize = () => (initialization ??= initialize());
    await admin.initialize();
    const router = express.Router();
    router.use((_req, res, next) => {
        res.set({
            'Cache-Control': 'no-store',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'Referrer-Policy': 'same-origin',
        });
        next();
    });
    router.use((req, res, next) => {
        // AdminJS's New form can use redirectUrl from the query string on Cancel.
        // Keep that navigation inside this editor, including browser URL parsing.
        const queryStart = req.originalUrl.indexOf('?');
        const redirects = [
            ...new URLSearchParams(
                queryStart < 0 ? '' : req.originalUrl.slice(queryStart + 1)
            ).entries(),
        ].filter(
            ([key]) =>
                key === 'redirectUrl' ||
                key.startsWith('redirectUrl[') ||
                key.startsWith('redirectUrl.')
        );
        if (redirects.length) {
            // AdminJS parses brackets/dots with qs, including redirectUrl[]=... .
            // Reject those shapes and duplicate keys before its browser code sees them.
            const [key, value] = redirects[0];
            let safe =
                redirects.length === 1 && key === 'redirectUrl' && !/[\\\x00-\x1f\x7f]/.test(value);
            if (safe) {
                try {
                    const url = new URL(value, config.origin);
                    safe =
                        value.startsWith('/admin/') &&
                        url.origin === config.origin &&
                        url.pathname.startsWith('/admin/');
                } catch {
                    safe = false;
                }
            }
            if (!safe) {
                res.status(400).send('Invalid admin redirect.');
                return;
            }
        }
        if (
            !['GET', 'HEAD', 'OPTIONS'].includes(req.method) &&
            req.get('origin') !== config.origin
        ) {
            res.status(403).send('Admin requests must come from the configured ADMIN_ORIGIN.');
            return;
        }
        if (
            req.method === 'GET' &&
            req.path === '/logout' &&
            req.get('sec-fetch-site') === 'cross-site'
        ) {
            res.status(403).send('Cross-site logout is not allowed.');
            return;
        }
        next();
    });
    router.post(
        '/login',
        rateLimit({
            windowMs: 15 * 60_000,
            limit: 10,
            standardHeaders: 'draft-8',
            legacyHeaders: false,
        })
    );
    buildAuthenticatedRouter(
        admin,
        {
            cookieName: 'portfolio_admin',
            cookiePassword: config.secret,
            authenticate: async (email, password, context) => {
                const validPassword = await verifyPassword(password, config.passwordHash);
                if (
                    typeof email !== 'string' ||
                    email.trim().toLowerCase() !== config.email.toLowerCase() ||
                    !validPassword
                )
                    return null;
                // Rotate the session ID on successful login to prevent session fixation.
                await new Promise<void>((resolve, reject) =>
                    context!.req.session.regenerate((error: unknown) =>
                        error ? reject(new Error('Login unavailable.')) : resolve()
                    )
                );
                return { email: config.email };
            },
        },
        router,
        {
            store,
            secret: config.secret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                httpOnly: true,
                secure: config.secure,
                sameSite: 'lax',
                maxAge: 8 * 60 * 60_000,
                path: '/admin',
            },
        },
        { maxFieldsSize: 64 * 1024, maxFileSize: 1, maxFields: 30, multiples: false }
    );
    return {
        router,
        close: async () => {
            store.close();
            await pool.end();
        },
    };
}

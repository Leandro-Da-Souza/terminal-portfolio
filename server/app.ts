import express, {
    type Request,
    type Response,
    type ErrorRequestHandler,
    type Router,
} from 'express';
import rateLimit from 'express-rate-limit';
import type { CommandRegistryType, CommandResult } from '../shared/types/command.js';
import { ContentUnavailableError } from './services/content.js';

export type SpiritStream = AsyncIterable<{ type: string; delta?: string }>;
export function createApp(options: {
    commands: CommandRegistryType;
    askMachineSpirit: (query: string) => Promise<SpiritStream>;
    adminRouter: Router;
    clientDistPath?: string;
    trustProxy?: number;
}) {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', options.trustProxy ?? 0);
    app.use('/admin', options.adminRouter);
    // AdminJS owns its body parser; JSON parsing is limited to the public terminal API.
    app.use('/terminal', express.json({ limit: '16kb' }));
    app.post('/terminal/command', async (req: Request, res: Response) => {
        const { command } = req.body ?? {};
        if (typeof command !== 'string') return commandError(res, 400, 'Invalid command payload.');
        const [name = '', ...args] = command.trim().toLowerCase().split(/\s+/);
        const definition = Object.hasOwn(options.commands, name)
            ? options.commands[name]
            : undefined;
        if (!definition) return commandError(res, 404, 'Unknown server command.');
        try {
            return res.json(await definition.execute(args));
        } catch (error) {
            return commandError(
                res,
                error instanceof ContentUnavailableError ? 503 : 500,
                error instanceof ContentUnavailableError
                    ? error.message
                    : 'Failed to execute command.'
            );
        }
    });
    app.post(
        '/terminal/machine-spirit',
        rateLimit({ windowMs: 60 * 60_000, limit: 5, standardHeaders: true }),
        async (req: Request, res: Response) => {
            const { query } = req.body ?? {};
            if (typeof query !== 'string')
                return commandError(res, 400, 'Invalid machine spirit payload.');
            try {
                const stream = await options.askMachineSpirit(query);
                res.set({
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                });
                for await (const event of stream)
                    if (event.type === 'response.output_text.delta') res.write(event.delta);
                return res.end();
            } catch (error) {
                if (res.headersSent) return res.end();
                return commandError(
                    res,
                    error instanceof ContentUnavailableError ? 503 : 500,
                    'Machine spirit unavailable.'
                );
            }
        }
    );
    if (options.clientDistPath) app.use(express.static(options.clientDistPath));
    app.use(((error, req, res, _next) => {
        if (res.headersSent) {
            res.end();
            return;
        }
        if (req.path.startsWith('/admin')) {
            res.status(503).send('Admin temporarily unavailable.');
            return;
        }
        commandError(res, 400, 'Invalid request.');
    }) as ErrorRequestHandler);
    return app;
}
function commandError(response: Response, status: number, output: string) {
    return response
        .status(status)
        .json({ type: 'output', output, variant: 'system' } satisfies CommandResult);
}

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import type { Request, Response } from 'express';

import type { CommandResult, ParsedCommand } from '../shared/types/command';
import type { StreamMessage } from '../shared/types/stream';
import { ServerCommandRegistry } from './commands/server-registry';
import { getRepositories } from './services/github';

const app = express();
const PORT = 3001;

app.use(
    cors({
        origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
    })
);

app.use(express.json());

const rateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
});

app.get('/', async (_, res: Response) => {
    try {
        const repos = await getRepositories();

        res.json(repos);
    } catch (error) {
        res.status(500).json({
            error: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});

app.post('/terminal/command', async (req: Request, res: Response) => {
    const { command } = req.body;

    if (typeof command !== 'string') {
        return handleCommandError(res, 400, 'Invalid command payload.');
    }

    const parsedCommand = parseCommand(command);
    const commandDef = ServerCommandRegistry[parsedCommand.name];

    if (!commandDef) {
        return handleCommandError(res, 404, 'Unknown server command.');
    }

    try {
        const result = await commandDef.execute(parsedCommand.args);

        return res.json(result);
    } catch {
        return handleCommandError(res, 500, 'Failed To Execute command');
    }
});

app.get('/terminal/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');

    res.setHeader('Cache-Control', 'no-cache');

    res.setHeader('Connection', 'keep-alive');

    const fakeData = ['INITIALIZING...', 'CONNECTING...', 'FETCHING...', 'COMPLETE...'];

    const timers = fakeData.map((data, index) => {
        return setTimeout(() => {
            const isLastMessage = index === fakeData.length - 1;

            writeStreamMessage(res, {
                type: isLastMessage ? 'complete' : 'message',
                output: data,
            });

            if (isLastMessage) {
                res.end();
            }
        }, 1200 * index);
    });

    req.on('close', () => {
        timers.forEach((timer) => {
            clearTimeout(timer);
        });
    });
});

// app.post('/terminal/machine-spirit', rateLimiter, (req: Request, res: Response) => {

// })

function writeStreamMessage(res: Response, message: StreamMessage): void {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
}

function parseCommand(command: string): ParsedCommand {
    const [name = '', ...args] = command.trim().toLocaleLowerCase().split(/\s+/);

    return { name, args };
}

function handleCommandError(response: Response, status: number, output: string) {
    return response.status(status).json({
        type: 'output',
        output: output ?? 'Unknown server error',
        variant: 'system',
    } satisfies CommandResult);
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

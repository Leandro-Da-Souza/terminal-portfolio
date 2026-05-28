import express from 'express';
import cors from 'cors';
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
        origin: 'http://localhost:5173',
    })
);

app.use(express.json());

app.get('/', async (_, res: Response) => {

    try {
        const repos = await getRepositories()

        res.json(repos)
    } catch(error) {
        res.status(500).json({
            error:
                error instanceof Error
                    ? error.message
                    : 'Unknown error'
        });
    }
});

app.post('/terminal/command', (req: Request, res: Response) => {
    const { command } = req.body;

    if (typeof command !== 'string') {
        return res.status(400).json({
            type: 'output',
            output: 'Invalid command payload.',
            variant: 'system',
        } satisfies CommandResult);
    }

    const parsedCommand = parseCommand(command);
    const commandDef = ServerCommandRegistry[parsedCommand.name];

    if (!commandDef) {
        return res.status(404).json({
            type: 'output',
            output: 'Unknown server command.',
            variant: 'system',
        } satisfies CommandResult);
    }

    return res.json(commandDef.execute(parsedCommand.args));
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

function writeStreamMessage(res: Response, message: StreamMessage): void {
    res.write(`data: ${JSON.stringify(message)}\n\n`);
}

function parseCommand(command: string): ParsedCommand {
    const [name = '', ...args] = command.trim().toLocaleLowerCase().split(/\s+/);

    return { name, args };
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

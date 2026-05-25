import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import type { CommandResult, ParsedCommand } from '../shared/types/command';
import { ServerCommandRegistry } from './commands/server-registry';

const app = express();
const PORT = 3001;

app.use(
    cors({
        origin: 'http://localhost:5173',
    })
);

app.use(express.json());

app.get('/', (_, res: Response) => {
    res.send('server alive');
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

function parseCommand(command: string): ParsedCommand {
    const [name = '', ...args] = command.trim().toLocaleLowerCase().split(/\s+/);

    return { name, args };
}

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

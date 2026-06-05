import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import { ServerCommandRegistry } from './commands/server-registry.js';
import { askMachineSpirit } from './services/openai.js';
const app = express();
const PORT = 3001;
const clientDistPath = process.env.NODE_ENV === 'production'
    ? path.resolve(__dirname, '../../../client/dist')
    : path.resolve(__dirname, '../client/dist');
console.log(clientDistPath);
app.use(express.static(clientDistPath));
app.use(express.json());
const rateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
});
app.post('/terminal/command', async (req, res) => {
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
    }
    catch {
        return handleCommandError(res, 500, 'Failed To Execute command');
    }
});
app.post('/terminal/machine-spirit', rateLimiter, async (req, res) => {
    const { query } = req.body;
    if (typeof query !== 'string') {
        return handleCommandError(res, 400, 'Invalid machine spirit payload.');
    }
    try {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');
        const stream = await askMachineSpirit(query);
        for await (const event of stream) {
            if (event.type === 'response.output_text.delta') {
                res.write(event.delta);
            }
        }
        return res.end();
    }
    catch {
        if (res.headersSent) {
            return res.end();
        }
        return handleCommandError(res, 500, 'Machine spirit unavailable.');
    }
});
function parseCommand(command) {
    const [name = '', ...args] = command.trim().toLocaleLowerCase().split(/\s+/);
    return { name, args };
}
function handleCommandError(response, status, output) {
    return response.status(status).json({
        type: 'output',
        output: output ?? 'Unknown server error',
        variant: 'system',
    });
}
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

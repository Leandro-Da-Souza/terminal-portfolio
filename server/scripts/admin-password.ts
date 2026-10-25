import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { randomBytes } from 'node:crypto';
import { hashPassword } from '../admin/password.js';

if (!process.stdin.isTTY) throw new Error('Run this command in an interactive terminal.');
const silent = new Writable({
    write(_chunk, _encoding, callback) {
        callback();
    },
});
const input = createInterface({ input: process.stdin, output: silent, terminal: true });
try {
    process.stdout.write('New admin password (12–256 characters; hidden): ');
    const password = await input.question('');
    process.stdout.write('\nConfirm password (hidden): ');
    const confirmation = await input.question('');
    process.stdout.write('\n');
    if (password !== confirmation) throw new Error('Passwords do not match.');
    console.log(`ADMIN_PASSWORD_HASH='${await hashPassword(password)}'`);
    console.log(`ADMIN_SESSION_SECRET='${randomBytes(32).toString('hex')}'`);
    console.log('Copy these into server/.env or the backend service variables. Keep them private.');
} catch (error) {
    console.error((error as Error).message);
    process.exitCode = 1;
} finally {
    input.close();
}

import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
const scrypt = promisify(scryptCallback);
export const isPasswordHash = (value: string) =>
    /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/.test(value);

export async function hashPassword(password: string): Promise<string> {
    if (password.length < 12 || password.length > 256)
        throw new Error('Use a password between 12 and 256 characters.');
    const salt = randomBytes(16).toString('hex');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return `scrypt$${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(password: unknown, encoded: string): Promise<boolean> {
    if (typeof password !== 'string' || password.length > 256 || !isPasswordHash(encoded))
        return false;
    const [, salt, hash] = encoded.split('$');
    const derived = (await scrypt(password, salt, 64)) as Buffer;
    return timingSafeEqual(derived, Buffer.from(hash, 'hex'));
}

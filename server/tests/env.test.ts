import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { repositoryRoot, serverRoot } from '../config/env.js';

test('explicit server/.env loading is independent of cwd; injected variables win', () => {
    const moduleUrl = pathToFileURL(path.join(serverRoot, 'config/env.ts')).href;
    const code = `await import(${JSON.stringify(moduleUrl)}); console.log(process.env.DATABASE_URL === 'injected-test-value');`;
    for (const cwd of [repositoryRoot, serverRoot]) {
        const output = execFileSync(
            process.execPath,
            ['--import', 'tsx', '--input-type=module', '-e', code],
            {
                cwd,
                env: { ...process.env, DATABASE_URL: 'injected-test-value' },
                encoding: 'utf8',
            }
        );
        assert.equal(output.trim(), 'true');
    }
});

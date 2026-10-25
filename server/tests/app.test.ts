import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import { createApp } from '../app.js';
import { createServerCommandRegistry } from '../commands/server-registry.js';
import { fixture } from './fixtures.js';

test('terminal API preserves output protocol and reports DB failures as system errors', async () => {
    const f = fixture();
    const app = createApp({
        commands: createServerCommandRegistry(f.portfolio),
        adminRouter: express.Router(),
        askMachineSpirit: async () => {
            throw new Error('stub');
        },
    });
    const about = await request(app)
        .post('/terminal/command')
        .send({ command: 'about' })
        .expect(200);
    assert.deepEqual(about.body, { type: 'output', output: 'about first line\n\nsecond line' });
    await request(app).post('/terminal/command').send({ command: '__proto__' }).expect(404);
    await request(app).post('/terminal/command').send({ command: 1 }).expect(400);
    f.fail(true);
    f.content.invalidate();
    const unavailable = await request(app)
        .post('/terminal/command')
        .send({ command: 'about' })
        .expect(503);
    assert.equal(unavailable.body.variant, 'system');
    assert.match(unavailable.body.output, /temporarily unavailable/);
    f.fail(false);
    await request(app).post('/terminal/command').send({ command: 'about' }).expect(200);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { sectionInput, projectInput, InputError } from '../admin/validation.js';
import { hashPassword, verifyPassword } from '../admin/password.js';
import { project } from './fixtures.js';

test('plain text preserves whitespace and normalizes CRLF', () => {
    assert.deepEqual(sectionInput({ body: ' A\r\n\r\n B\t', key: 'forged' }), {
        body: ' A\n\n B\t',
    });
    for (const body of ['', '  ', '\u0000', 'a'.repeat(20001)])
        assert.throws(() => sectionInput({ body }), InputError);
});
test('project validation normalizes identity and ignores fields outside the allowlist', () => {
    const value = projectInput({
        ...project(),
        owner: '  Leandro-Da-Souza ',
        repo: 'Examensarbete',
        featured: 'true',
        position: '6',
        id: 'forged',
        description: 'forged',
    });
    assert.equal(value.owner, 'leandro-da-souza');
    assert.equal(value.repo, 'examensarbete');
    assert.equal(projectInput({ ...project(), featured: undefined }).featured, false);
    assert.equal(value.position, 6);
    assert.equal(value.featured, true);
    assert.ok(!('description' in value));
    assert.ok(!('id' in value));
});
test('invalid positions, paths, empty names and booleans are rejected', () => {
    for (const position of [0, -1, 1.5, '1e2', 'NaN', 2147483648, ''])
        assert.throws(() => projectInput({ ...project(), position }), InputError);
    for (const value of [
        { owner: 'https://github.com' },
        { repo: '../path' },
        { repo: '..' },
        { displayName: ' ' },
        { displayName: 'x\ny' },
        { featured: 'yes' },
    ])
        assert.throws(() => projectInput({ ...project(), ...value }), InputError);
});
test('scrypt validates passwords without accepting malformed hashes', async () => {
    const hash = await hashPassword('test-only-long-password');
    assert.ok(await verifyPassword('test-only-long-password', hash));
    assert.equal(await verifyPassword('wrong', hash), false);
    assert.equal(await verifyPassword('wrong', 'malformed'), false);
    await assert.rejects(hashPassword('short'));
});

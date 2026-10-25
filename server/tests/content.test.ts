import test from 'node:test';
import assert from 'node:assert/strict';
import {
    createContentService,
    ContentUnavailableError,
    CONTENT_CACHE_MS,
} from '../services/content.js';
import {
    createGithubService,
    GITHUB_CACHE_MS,
    GITHUB_FAILURE_CACHE_MS,
} from '../services/github.js';
import { createServerCommandRegistry } from '../commands/server-registry.js';
import { buildMachineSpiritContext } from '../services/machine-spirit-context.js';
import { createMachineSpirit } from '../services/openai.js';
import { fixture, project } from './fixtures.js';

test('sections preserve line breaks; edits become visible on invalidation or TTL', async () => {
    const f = fixture();
    const before = await f.content.getSections();
    f.rows[0].body = 'Changed\n\nWith spacing';
    assert.equal((await f.content.getSections()).about, before.about);
    f.tick(CONTENT_CACHE_MS);
    assert.equal((await f.content.getSections()).about, 'Changed\n\nWith spacing');
    f.rows[0].body = 'Changed again';
    f.content.invalidate();
    assert.equal((await f.content.getSections()).about, 'Changed again');
});

test('missing sections and expired cache during failure return an error; recovery works', async () => {
    const f = fixture();
    await f.content.getSections();
    await f.content.getProjects();
    f.fail(true);
    assert.ok((await f.content.getSections()).about);
    f.tick(CONTENT_CACHE_MS);
    await assert.rejects(f.content.getSections(), ContentUnavailableError);
    await assert.rejects(f.content.getProjects(), ContentUnavailableError);
    f.fail(false);
    assert.equal((await f.content.getProjects()).length, 2);
    f.rows.pop();
    await assert.rejects(f.content.getSections(), ContentUnavailableError);
});

test('a pre-edit read cannot repopulate an invalidated cache', async () => {
    const f = fixture();
    let resolve!: (value: typeof f.rows) => void;
    let reads = 0;
    const content = createContentService({
        readProjects: async () => [],
        readSections: async () => {
            reads++;
            if (reads > 1) return f.rows;
            return new Promise((r) => {
                resolve = r;
            });
        },
    });
    const request = content.getSections();
    content.invalidate();
    resolve(f.rows.map((row) => ({ ...row, body: 'stale' })));
    await request;
    assert.notEqual((await content.getSections()).about, 'stale');
    assert.equal(reads, 2);
});

test('commands and machine context consume the same edited sections without OpenAI', async () => {
    const f = fixture();
    const commands = createServerCommandRegistry(f.portfolio);
    for (const key of ['about', 'skills', 'experience', 'contact'] as const) {
        f.rows.find((row) => row.key === key)!.body = `Edited ${key}\n  indented line`;
        f.content.invalidate();
        const result = await commands[key].execute();
        assert.equal(result.type, 'output');
        if (result.type === 'output')
            assert.ok(
                (await buildMachineSpiritContext(f.portfolio, false)).includes(result.output)
            );
    }
    f.rows.find((row) => row.key === 'interests')!.body = 'Edited interests';
    f.content.invalidate();
    assert.match(await buildMachineSpiritContext(f.portfolio, false), /Edited interests/);
    assert.equal(f.calls(), 0);
});

test('project ordering, numeric/name lookup, hidden projects and ambiguous names', async () => {
    const f = fixture();
    const commands = createServerCommandRegistry(f.portfolio);
    const list = await commands.projects.execute();
    assert.equal(list.type, 'output');
    if (list.type !== 'output') return;
    assert.ok(list.output.indexOf('[1]') < list.output.indexOf('[2]'));
    assert.ok(!list.output.includes('[3]'));
    assert.equal(f.calls(), 0);
    assert.deepEqual(
        await commands.project.execute(['1']),
        await commands.project.execute(['project', '1'])
    );
    assert.deepEqual(await commands.project.execute(['3']), {
        type: 'output',
        output: 'Project not found.',
    });
    f.projects[0].displayName = 'Project 1';
    f.content.invalidate();
    assert.match(JSON.stringify(await commands.project.execute(['project', '1'])), /More than one/);
    assert.doesNotMatch(JSON.stringify(await commands.project.execute(['2'])), /More than one/);
});

test('unavailable metadata keeps the project visible and isolates other projects', async () => {
    const f = fixture();
    f.projects[0].repo = 'missing';
    const commands = createServerCommandRegistry(f.portfolio);
    assert.match(JSON.stringify(await commands.projects.execute()), /Project 2/);
    assert.match(JSON.stringify(await commands.project.execute(['2'])), /temporarily unavailable/);
    assert.match(
        JSON.stringify(await commands.project.execute(['1'])),
        /GitHub description example\/repo-1/
    );
    const context = await buildMachineSpiritContext(f.portfolio);
    assert.match(context, /GitHub metadata temporarily unavailable/);
    assert.match(context, /https:\/\/github.com\/example\/repo-1/);
});

test('GitHub cache keys include owner, failures retry after 30s, successes after 5m', async () => {
    let time = 0;
    let calls = 0;
    let broken = false;
    const github = createGithubService(
        async (owner, repo) => {
            calls++;
            if (broken) throw new Error('Unavailable');
            return { description: owner, url: `https://github.com/${owner}/${repo}`, topics: [] };
        },
        () => time
    );
    await github.getRepository('first', 'same');
    await github.getRepository('FIRST', 'SAME');
    await github.getRepository('second', 'same');
    assert.equal(calls, 2);
    time += GITHUB_CACHE_MS;
    broken = true;
    assert.equal(await github.getRepository('first', 'same'), null);
    broken = false;
    assert.equal(await github.getRepository('first', 'same'), null);
    time += GITHUB_FAILURE_CACHE_MS;
    assert.ok(await github.getRepository('first', 'same'));
    assert.equal(calls, 4);
});

test('machine request uses updated context and never contacts responder on DB failure', async () => {
    const f = fixture();
    let calls = 0;
    let input = '';
    const ask = createMachineSpirit(f.portfolio, async (value) => {
        calls++;
        input = value;
        return (async function* () {
            yield { type: 'response.output_text.delta', delta: 'stub' };
        })();
    });
    f.rows[0].body = 'Newest about';
    await ask('Who is Leandro?');
    assert.match(input, /Newest about/);
    assert.match(input, /VISITOR QUESTION/);
    assert.equal(calls, 1);
    f.fail(true);
    f.content.invalidate();
    await assert.rejects(ask('Who is Leandro?'), ContentUnavailableError);
    assert.equal(calls, 1);
});

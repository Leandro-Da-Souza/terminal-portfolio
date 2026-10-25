import '../config/env.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import pg from 'pg';
import request from 'supertest';
import { serverRoot } from '../config/env.js';
import { createDatabase } from '../services/database.js';
import { seedContent } from '../prisma/seed-content.js';
import { createContentService, prismaContentStore } from '../services/content.js';
import { createGithubService } from '../services/github.js';
import { createPortfolioService } from '../services/portfolio.js';
import { createServerCommandRegistry } from '../commands/server-registry.js';
import { buildMachineSpiritContext } from '../services/machine-spirit-context.js';
import { createAdmin } from '../admin/index.js';
import { hashPassword } from '../admin/password.js';
import { createApp } from '../app.js';

// Never point tests at the development schema, even when using the same local server.
// Refuse remote hosts; every write and migration is isolated in one random schema.
test(
    'isolated PostgreSQL migrations, editing, authentication and persistent sessions',
    { timeout: 120_000 },
    async (t) => {
        const base = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
        assert.ok(base, 'DATABASE_URL or TEST_DATABASE_URL is required.');
        const url = new URL(base);
        assert.ok(
            ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname),
            'Database tests require a loopback host.'
        );
        const schema = `portfolio_test_${randomUUID().replaceAll('-', '')}`;
        url.searchParams.set('schema', schema);
        const testUrl = url.toString();
        const control = new pg.Client({ connectionString: base });
        const db = createDatabase(testUrl);
        let cleanupAdmin: (() => Promise<void>) | undefined;
        await control.connect();
        try {
            await control.query(`CREATE SCHEMA "${schema}"`);
            const cli = path.join(serverRoot, '../node_modules/prisma/build/index.js');
            try {
                execFileSync(process.execPath, [cli, 'migrate', 'deploy'], {
                    cwd: serverRoot,
                    env: { ...process.env, DATABASE_URL: testUrl, NODE_ENV: 'test' },
                    stdio: 'pipe',
                });
            } catch {
                throw new Error('Test schema migration failed (connection details suppressed).');
            }
            assert.deepEqual(await seedContent(db), { sections: 5, projects: 5 });
            const config = {
                email: 'test@example.com',
                passwordHash: await hashPassword('test-only-long-password'),
                secret: randomUUID() + randomUUID(),
                origin: 'http://localhost:3001',
                secure: false,
            };
            const content = createContentService(prismaContentStore(db));
            const portfolio = createPortfolioService(
                content,
                createGithubService(async (owner, repo) => ({
                    description: `Fixture ${owner}/${repo}`,
                    topics: ['stub'],
                    url: `https://github.com/${owner}/${repo}`,
                }))
            );
            const mount = async (secure = false) => {
                const admin = await createAdmin(db, content, testUrl, { ...config, secure });
                cleanupAdmin = admin.close;
                const app = createApp({
                    adminRouter: admin.router,
                    commands: createServerCommandRegistry(portfolio),
                    trustProxy: secure ? 1 : 0,
                    askMachineSpirit: async () => {
                        throw new Error('Live OpenAI forbidden in tests.');
                    },
                });
                return { app, admin };
            };
            let { app, admin } = await mount();
            const edit = '/admin/api/resources/ContentSection/records/about/edit';
            const list = '/admin/api/resources/ContentSection/actions/list';
            const projectNew = '/admin/api/resources/FeaturedProject/actions/new';
            const valid = {
                owner: 'Example',
                repo: 'new-project',
                displayName: 'QA project',
                featured: 'true',
                position: '6',
            };
            const agent = request.agent(app);
            let cookie = '';
            await t.test(
                'pages and direct read/write actions require login; login rejects invalid credentials',
                async () => {
                    await request(app).get('/admin').expect(302).expect('Location', '/admin/login');
                    await request(app).get(list).expect(302);
                    await request(app)
                        .post(edit)
                        .set('Origin', config.origin)
                        .send({ body: 'forged' })
                        .expect(302);
                    assert.notEqual(
                        (await db.contentSection.findUniqueOrThrow({ where: { key: 'about' } }))
                            .body,
                        'forged'
                    );
                    const bad = await request(app)
                        .post('/admin/login')
                        .set('Origin', config.origin)
                        .type('form')
                        .send({ email: config.email, password: 'wrong' })
                        .expect(200);
                    assert.ok(bad.text.includes('invalidCredentials'));
                    const login = await agent
                        .post('/admin/login')
                        .set('Origin', config.origin)
                        .type('form')
                        .send({ email: config.email, password: 'test-only-long-password' })
                        .expect(302);
                    const cookies = login.headers['set-cookie'];
                    assert.ok(cookies);
                    cookie = cookies[0].split(';')[0];
                    const newForm = '/admin/resources/FeaturedProject/actions/new';
                    for (const redirectUrl of [
                        'https://untrusted.example',
                        '//untrusted.example',
                        '/admin/\\untrusted.example',
                    ]) {
                        await agent.get(newForm).query({ redirectUrl }).expect(400);
                    }
                    await agent
                        .get(newForm)
                        .query({ 'redirectUrl[]': 'https://untrusted.example' })
                        .expect(400);
                    await agent
                        .get(
                            newForm +
                                '?redirectUrl=%2Fadmin%2Fresources%2FFeaturedProject&redirectUrl=https%3A%2F%2Funtrusted.example'
                        )
                        .expect(400);
                    await agent
                        .get(
                            newForm +
                                '?redirectUrl=/admin/resources?tab=one&redirectUrl=https://untrusted.example'
                        )
                        .expect(400);
                    await agent
                        .get(newForm)
                        .query({ redirectUrl: '/admin/resources/FeaturedProject' })
                        .expect(200);
                    assert.match(cookies[0], /HttpOnly/);
                    assert.match(cookies[0], /SameSite=Lax/);
                    assert.match(cookies[0], /Path=\/admin/);
                    assert.doesNotMatch(cookies[0], /; Secure/);
                    for (const name of ['global', 'design-system', 'app', 'components'])
                        await request(app)
                            .get(`/admin/frontend/assets/${name}.bundle.js`)
                            .expect(200);
                    const response = await agent.get(list).expect(200);
                    assert.equal(response.body.records.length, 5);
                    assert.ok((await db.adminSession.count()) > 0);
                }
            );
            await t.test(
                'section edits preserve text and immediately reach terminal and machine context',
                async () => {
                    await portfolio.getSections();
                    const response = await agent
                        .post(edit)
                        .set('Origin', config.origin)
                        .field('body', 'QA first line\n\n  QA indented line')
                        .field('key', 'forged')
                        .expect(200);
                    assert.deepEqual(response.body.record.errors, {});
                    assert.equal(response.body.record.params.key, 'about');
                    const terminal = await agent
                        .post('/terminal/command')
                        .send({ command: 'about' })
                        .expect(200);
                    assert.equal(terminal.body.output, 'QA first line\n\n  QA indented line');
                    assert.ok(
                        (await buildMachineSpiritContext(portfolio, false)).includes(
                            terminal.body.output
                        )
                    );
                    const invalid = await agent
                        .post(edit)
                        .set('Origin', config.origin)
                        .field('body', ' ')
                        .expect(200);
                    assert.ok(invalid.body.record.errors.body);
                    await agent
                        .post(edit)
                        .set('Origin', 'https://untrusted.example')
                        .send({ body: 'forged' })
                        .expect(403);
                    await agent.post(edit).send({ body: 'forged' }).expect(403);
                    const forbidden = await agent
                        .post('/admin/api/resources/ContentSection/actions/new')
                        .set('Origin', config.origin)
                        .send({ key: 'extra', body: 'x' });
                    assert.equal(forbidden.body.notice.type, 'error');
                    assert.equal(await db.contentSection.count(), 5);
                }
            );
            await t.test(
                'projects enforce canonical identity and unique positive positions, including hidden rows',
                async () => {
                    const added = await agent
                        .post(projectNew)
                        .set('Origin', config.origin)
                        .send(valid)
                        .expect(200);
                    assert.deepEqual(added.body.record.errors, {});
                    assert.equal(added.body.record.params.owner, 'example');
                    const id = added.body.record.params.id;
                    const editProject = `/admin/api/resources/FeaturedProject/records/${id}/edit`;
                    const duplicate = await agent
                        .post(projectNew)
                        .set('Origin', config.origin)
                        .send({ ...valid, position: '7' })
                        .expect(200);
                    assert.ok(duplicate.body.record.errors.repo);
                    const position = await agent
                        .post(projectNew)
                        .set('Origin', config.origin)
                        .send({ ...valid, repo: 'another' })
                        .expect(200);
                    assert.ok(position.body.record.errors.position);
                    const invalid = await agent
                        .post(editProject)
                        .set('Origin', config.origin)
                        .send({ ...valid, position: '0' })
                        .expect(200);
                    assert.ok(invalid.body.record.errors.position);
                    await agent
                        .post(editProject)
                        .set('Origin', config.origin)
                        .send({
                            ...valid,
                            featured: false,
                            displayName: 'Renamed QA',
                            position: '7',
                        })
                        .expect(200);
                    assert.ok(!(await portfolio.getProjects()).some((p) => p.id === id));
                    const hiddenPosition = await agent
                        .post(projectNew)
                        .set('Origin', config.origin)
                        .send({ ...valid, repo: 'hidden-position-conflict', position: '7' })
                        .expect(200);
                    assert.ok(hiddenPosition.body.record.errors.position);
                    await agent
                        .post(editProject)
                        .set('Origin', config.origin)
                        .send({
                            ...valid,
                            featured: true,
                            displayName: 'Renamed QA',
                            position: '7',
                        })
                        .expect(200);
                    const byNumber = await request(app)
                        .post('/terminal/command')
                        .send({ command: 'project 7' })
                        .expect(200);
                    const byName = await request(app)
                        .post('/terminal/command')
                        .send({ command: 'project renamed qa' })
                        .expect(200);
                    assert.deepEqual(byNumber.body, byName.body);
                    assert.match(byNumber.body.output, /Fixture example\/new-project/);
                    await assert.rejects(
                        db.featuredProject.create({
                            data: {
                                ...valid,
                                owner: 'example',
                                repo: 'direct',
                                position: 7,
                                featured: false,
                            },
                        }),
                        { code: 'P2002' }
                    );
                    await assert.rejects(
                        db.featuredProject.create({
                            data: {
                                ...valid,
                                owner: 'example',
                                repo: 'negative',
                                position: -1,
                                featured: false,
                            },
                        })
                    );
                    await assert.rejects(
                        db.featuredProject.create({
                            data: {
                                ...valid,
                                owner: 'EXAMPLE',
                                repo: 'uppercase',
                                position: 8,
                                featured: false,
                            },
                        })
                    );
                    const denied = await agent
                        .post(`/admin/api/resources/FeaturedProject/records/${id}/delete`)
                        .set('Origin', config.origin)
                        .send({});
                    assert.equal(denied.body.notice.type, 'error');
                    assert.ok(await db.featuredProject.findUnique({ where: { id } }));
                }
            );
            await t.test(
                'seeding preserves CMS edits and changed seed identities without duplication',
                async () => {
                    await db.featuredProject.update({
                        where: { id: 'seed-comboforge' },
                        data: {
                            repo: 'changed-identity',
                            featured: false,
                            position: 20,
                            displayName: 'Edited seed',
                        },
                    });
                    assert.deepEqual(await seedContent(db), { sections: 0, projects: 0 });
                    assert.equal(await db.featuredProject.count(), 6);
                    assert.equal(await db.contentSection.count(), 5);
                    assert.equal(
                        (
                            await db.featuredProject.findUniqueOrThrow({
                                where: { id: 'seed-comboforge' },
                            })
                        ).repo,
                        'changed-identity'
                    );
                    assert.equal(
                        (await db.contentSection.findUniqueOrThrow({ where: { key: 'about' } }))
                            .body,
                        'QA first line\n\n  QA indented line'
                    );
                }
            );
            await t.test(
                'sessions persist across app/store restart; logout invalidates them',
                async () => {
                    await admin.close();
                    cleanupAdmin = undefined;
                    ({ app, admin } = await mount());
                    await request(app).get(list).set('Cookie', cookie).expect(200);
                    await request(app).get('/admin/logout').set('Cookie', cookie).expect(302);
                    await request(app).get(list).set('Cookie', cookie).expect(302);
                }
            );
            await t.test(
                'production cookies are secure behind the trusted Railway proxy',
                async () => {
                    await admin.close();
                    cleanupAdmin = undefined;
                    ({ app, admin } = await mount(true));
                    const login = await request(app)
                        .post('/admin/login')
                        .set('X-Forwarded-Proto', 'https')
                        .set('Origin', config.origin)
                        .type('form')
                        .send({ email: config.email, password: 'test-only-long-password' })
                        .expect(302);
                    assert.match(login.headers['set-cookie'][0], /; Secure/);
                }
            );
            if (process.env.RUN_BROWSER_QA === '1') {
                await t.test(
                    'browser login, editing and terminal regressions without external services',
                    { timeout: 90_000 },
                    async () => {
                        const { browserChecks } = await import('./browser-checks.js');
                        await browserChecks(db, content, portfolio, testUrl, config);
                    }
                );
            }
        } finally {
            await cleanupAdmin?.();
            await db.$disconnect();
            // The only DROP target is the random, validated schema created by this test.
            assert.match(schema, /^portfolio_test_[a-f0-9]{32}$/);
            await control.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
            await control.end();
        }
    }
);

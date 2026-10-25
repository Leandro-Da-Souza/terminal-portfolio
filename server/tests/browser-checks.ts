import assert from 'node:assert/strict';
import path from 'node:path';
import type { AddressInfo } from 'node:net';
import type { PrismaClient } from '@prisma/client';
import { chromium, expect } from '@playwright/test';
import { createAdmin, type AdminConfig } from '../admin/index.js';
import { createApp } from '../app.js';
import { createServerCommandRegistry } from '../commands/server-registry.js';
import { createMachineSpirit } from '../services/openai.js';
import type { ContentService } from '../services/content.js';
import type { PortfolioService } from '../services/portfolio.js';
import { repositoryRoot } from '../config/env.js';

export async function browserChecks(
    db: PrismaClient,
    content: ContentService,
    portfolio: PortfolioService,
    testUrl: string,
    config: AdminConfig
) {
    const browserConfig = { ...config, secure: false };
    const admin = await createAdmin(db, content, testUrl, browserConfig);
    const app = createApp({
        adminRouter: admin.router,
        commands: createServerCommandRegistry(portfolio),
        clientDistPath: path.join(repositoryRoot, 'client/dist'),
        askMachineSpirit: createMachineSpirit(portfolio, async () =>
            (async function* () {
                yield { type: 'response.output_text.delta', delta: 'Offline test response.' };
            })()
        ),
    });
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    browserConfig.origin = origin;
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
        browser = await chromium.launch({ headless: true });
        const context = await browser.newContext();
        // No external requests, including fonts, GitHub and OpenAI, leave this browser.
        await context.route('**/*', (route) =>
            new URL(route.request().url()).origin === origin ? route.continue() : route.abort()
        );
        const page = await context.newPage();
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.goto(`${origin}/admin`);
        await page.locator('input[name=email]').fill(config.email);
        await page.locator('input[name=password]').fill('test-only-long-password');
        await page.getByRole('button', { name: 'Login', exact: true }).click();
        await expect(page).toHaveURL(`${origin}/admin`);
        await page.goto(`${origin}/admin/resources/ContentSection/records/about/edit`);
        await page
            .locator('textarea[name=body]')
            .fill('Browser edited about\n\n  Preserved indentation');
        const saveSection = page.waitForResponse(
            (response) =>
                response.url().endsWith('/records/about/edit') &&
                response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        assert.deepEqual((await (await saveSection).json()).record.errors, {});
        assert.equal(
            (await db.contentSection.findUniqueOrThrow({ where: { key: 'about' } })).body,
            'Browser edited about\n\n  Preserved indentation'
        );

        await page.goto(`${origin}/admin/resources/FeaturedProject/actions/new`);
        for (const [field, value] of Object.entries({
            owner: 'Example',
            repo: 'browser-project',
            displayName: 'Browser project',
            position: '9',
        }))
            await page.locator(`#${field}`).fill(value);
        const saveProject = page.waitForResponse(
            (response) =>
                response.url().endsWith('/FeaturedProject/actions/new') &&
                response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        const saved = await (await saveProject).json();
        assert.deepEqual(saved.record.errors, {});
        assert.equal(saved.record.params.featured, false, 'New projects start hidden.');
        const id = saved.record.params.id;
        await page.goto(`${origin}/admin/resources/FeaturedProject/records/${id}/edit`);
        await page.locator('#displayName').fill('Browser renamed');
        await page.locator('#position').fill('8');
        // AdminJS renders a styled sibling over its native checkbox.
        await page.locator('#featured + a').click();
        await expect(page.locator('#featured')).toBeChecked();
        if (process.env.QA_SCREENSHOTS === '1')
            await page.screenshot({ path: '/tmp/portfolio-admin-qa.png', fullPage: true });
        const updateProject = page.waitForResponse(
            (response) =>
                response.url().endsWith(`/records/${id}/edit`) &&
                response.request().method() === 'POST'
        );
        await page.getByRole('button', { name: 'Save', exact: true }).click();
        assert.deepEqual((await (await updateProject).json()).record.errors, {});

        await page.goto(origin);
        const input = page.locator('terminal-input input');
        await expect(input).toBeEnabled();
        const command = async (text: string) => {
            await expect(input).toBeEnabled();
            await input.fill(text);
            await input.press('Enter');
        };
        await command('about');
        await expect(page.locator('terminal-entry .output').last()).toHaveText(
            'Browser edited about\n\n  Preserved indentation',
            { useInnerText: false, timeout: 10_000 }
        );
        // textContent checks exact newlines instead of Playwright's whitespace-normalized matcher.
        assert.equal(
            await page.locator('terminal-entry .output').last().textContent(),
            'Browser edited about\n\n  Preserved indentation'
        );
        if (process.env.QA_SCREENSHOTS === '1')
            await page.screenshot({ path: '/tmp/portfolio-terminal-qa.png', fullPage: true });
        await command('project 8');
        await expect(page.locator('terminal-entry .output').last()).toContainText(
            'Browser renamed',
            { timeout: 10_000 }
        );
        await command('theme matrix');
        await expect(page.locator('html')).toHaveAttribute('data-theme', 'matrix');
        await command('clear');
        await expect(page.locator('terminal-entry')).toHaveCount(0);
        await command('help');
        await expect(page.locator('terminal-entry .output').last()).toContainText(
            'help - List available commands'
        );
        await expect(input).toBeEnabled();
        await input.press('ArrowUp');
        await expect(input).toHaveValue('help');
        await input.fill('abo');
        await input.press('Tab');
        await expect(input).toHaveValue('about');
        await command('exit');
        await expect(page.locator('.terminal-window')).toHaveClass(/closed/, { timeout: 10_000 });
        await page.locator('.reboot-button').click();
        await expect(input).toBeEnabled();
        await expect(page.locator('.terminal-window')).not.toHaveClass(/opening/);
        await command('machine-spirit');
        await expect(page.locator('.terminal-window')).toHaveAttribute(
            'data-mode',
            'machine-spirit'
        );
        await expect(page.locator('.signal-noise')).toHaveCSS('display', 'block');
        await expect(page.locator('.signal-noise')).toHaveCSS('pointer-events', 'none');
        await expect(page.locator('.signal-band')).toHaveCSS('pointer-events', 'none');
        if (process.env.QA_SCREENSHOTS === '1')
            await page.screenshot({ path: '/tmp/portfolio-machine-spirit-on.png', fullPage: true });
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await expect(page.locator('.signal-noise')).toHaveCSS('opacity', '0.016');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await command('Who is Leandro?');
        await expect(page.locator('terminal-entry .output').last()).toHaveText(
            'Offline test response.',
            { timeout: 15_000 }
        );
        await command('exit');
        await expect(page.locator('.terminal-window')).not.toHaveAttribute(
            'data-mode',
            'machine-spirit'
        );
        await expect(page.locator('.signal-noise')).toHaveCSS('display', 'none');
        if (process.env.QA_SCREENSHOTS === '1')
            await page.screenshot({
                path: '/tmp/portfolio-machine-spirit-off.png',
                fullPage: true,
            });
        await command('machine-spirit');
        await expect(page.locator('.signal-noise')).toHaveCSS('display', 'block');
        await command('exit');
        await expect(page.locator('.signal-noise')).toHaveCSS('display', 'none');
        await page.goto(`${origin}/admin/logout`);
        await expect(page).toHaveURL(`${origin}/admin/login`);
        await page.goto(`${origin}/admin/resources/ContentSection`);
        await expect(page).toHaveURL(`${origin}/admin/login`);
        assert.deepEqual(
            errors,
            [],
            'The editor and terminal must run without browser JavaScript exceptions.'
        );
    } finally {
        await browser?.close();
        await new Promise<void>((resolve, reject) =>
            server.close((error) => (error ? reject(error) : resolve()))
        );
        await admin.close();
    }
}

import './config/env.js';
import path from 'node:path';
import { repositoryRoot } from './config/env.js';
import { createApp } from './app.js';
import { createDatabase } from './services/database.js';
import { createContentService, prismaContentStore } from './services/content.js';
import { createGithubService, githubFetcher } from './services/github.js';
import { createPortfolioService } from './services/portfolio.js';
import { createServerCommandRegistry } from './commands/server-registry.js';
import { createMachineSpirit } from './services/openai.js';
import { createAdmin, adminConfigFromEnv } from './admin/index.js';

async function start() {
    const config = adminConfigFromEnv();
    const port = Number(process.env.PORT ?? 3001);
    const trustProxy = Number(process.env.TRUST_PROXY ?? 0);
    if (!Number.isInteger(port) || port < 1 || port > 65535 || ![0, 1].includes(trustProxy))
        throw new Error('Invalid PORT or TRUST_PROXY configuration.');
    const db = createDatabase();
    const content = createContentService(prismaContentStore(db));
    const portfolio = createPortfolioService(
        content,
        createGithubService(githubFetcher(process.env.GITHUB_TOKEN))
    );
    const admin = await createAdmin(db, content, process.env.DATABASE_URL!, config);
    const app = createApp({
        commands: createServerCommandRegistry(portfolio),
        askMachineSpirit: createMachineSpirit(portfolio),
        adminRouter: admin.router,
        clientDistPath: path.join(repositoryRoot, 'client/dist'),
        trustProxy,
    });
    const server = app.listen(port, '0.0.0.0', () =>
        console.log(`Terminal: http://localhost:${port} | Editor: ${config.origin}/admin`)
    );
    const shutdown = () =>
        server.close(async () => {
            await admin.close();
            await db.$disconnect();
            process.exit(0);
        });
    process.once('SIGINT', shutdown);
    process.once('SIGTERM', shutdown);
}
start().catch((error: unknown) => {
    console.error(
        error instanceof Error && /^(Configure ADMIN|Invalid PORT|DATABASE_URL)/.test(error.message)
            ? error.message
            : 'Startup failed. Check configuration, dependencies, and database availability.'
    );
    process.exitCode = 1;
});

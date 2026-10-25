import '../config/env.js';
import { createDatabase } from '../services/database.js';
import { createContentService, prismaContentStore } from '../services/content.js';
import { createGithubService, githubFetcher } from '../services/github.js';
import { createPortfolioService } from '../services/portfolio.js';
import { buildMachineSpiritContext } from '../services/machine-spirit-context.js';

const db = createDatabase();
try {
    const portfolio = createPortfolioService(
        createContentService(prismaContentStore(db)),
        createGithubService(githubFetcher(process.env.GITHUB_TOKEN))
    );
    console.log(
        await buildMachineSpiritContext(portfolio, !process.argv.includes('--sections-only'))
    );
} catch {
    console.error('Content unavailable. Check DATABASE_URL and migrations.');
    process.exitCode = 1;
} finally {
    await db.$disconnect();
}

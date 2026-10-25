import { Octokit } from 'octokit';
import type { GithubRepository } from '../../shared/types/project.js';

export const GITHUB_CACHE_MS = 5 * 60_000;
export const GITHUB_FAILURE_CACHE_MS = 30_000;
export type RepositoryFetcher = (owner: string, repo: string) => Promise<GithubRepository>;

export function githubFetcher(token?: string): RepositoryFetcher {
    const octokit = new Octokit({ auth: token, request: { timeout: 5_000 } });
    return async (owner, repo) => {
        const { data } = await octokit.rest.repos.get({ owner, repo });
        // Portfolio data is public even if the configured GitHub token can see private repos.
        if (data.private) throw new Error('Repository is not public.');
        return { description: data.description, url: data.html_url, topics: data.topics ?? [] };
    };
}

export function createGithubService(fetchRepository: RepositoryFetcher, now = Date.now) {
    const cache = new Map<string, { value: GithubRepository | null; expires: number }>();
    const pending = new Map<string, Promise<GithubRepository | null>>();
    return {
        async getRepository(owner: string, repo: string): Promise<GithubRepository | null> {
            const key = `${owner.toLowerCase()}/${repo.toLowerCase()}`;
            const cached = cache.get(key);
            if (cached && cached.expires > now()) return cached.value;
            if (pending.has(key)) return pending.get(key)!;
            const request = (async () => {
                let value: GithubRepository | null = null;
                try {
                    value = await fetchRepository(owner, repo);
                } catch {
                    /* Isolate each repository failure. */
                }
                // Bound memory even if an editor repeatedly changes repository identities.
                if (cache.size >= 200) cache.delete(cache.keys().next().value!);
                cache.set(key, {
                    value,
                    expires: now() + (value ? GITHUB_CACHE_MS : GITHUB_FAILURE_CACHE_MS),
                });
                return value;
            })();
            pending.set(key, request);
            try {
                return await request;
            } finally {
                pending.delete(key);
            }
        },
    };
}
export type GithubService = ReturnType<typeof createGithubService>;

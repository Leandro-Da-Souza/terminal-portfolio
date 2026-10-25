import { createContentService, SECTION_KEYS, type ContentStore } from '../services/content.js';
import { createGithubService } from '../services/github.js';
import { createPortfolioService } from '../services/portfolio.js';
import type { ProjectCuration } from '../../shared/types/project.js';

export const project = (position = 1): ProjectCuration => ({
    id: `p${position}`,
    owner: 'example',
    repo: `repo-${position}`,
    displayName: `Project ${position}`,
    position,
    featured: true,
});
export function fixture() {
    const rows = SECTION_KEYS.map((key) => ({ key, body: `${key} first line\n\nsecond line` }));
    const projects = [project(2), project(1), { ...project(3), featured: false }];
    let broken = false;
    let time = 0;
    const store: ContentStore = {
        readSections: async () => {
            if (broken) throw new Error('database connection failed');
            return rows;
        },
        readProjects: async () => {
            if (broken) throw new Error('database connection failed');
            return projects;
        },
    };
    const content = createContentService(store, () => time);
    let githubCalls = 0;
    const github = createGithubService(
        async (owner, repo) => {
            githubCalls++;
            if (repo === 'missing') throw new Error('404');
            return {
                description: `GitHub description ${owner}/${repo}`,
                topics: ['typescript'],
                url: `https://github.com/${owner}/${repo}`,
            };
        },
        () => time
    );
    return {
        rows,
        projects,
        content,
        portfolio: createPortfolioService(content, github),
        tick: (ms: number) => {
            time += ms;
        },
        fail: (value: boolean) => {
            broken = value;
        },
        calls: () => githubCalls,
    };
}

import type { ContentService } from './content.js';
import type { GithubService } from './github.js';
import type { PortfolioProject } from '../../shared/types/project.js';

export const normalizeProjectName = (value: string) =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '');

export function createPortfolioService(content: ContentService, github: GithubService) {
    return {
        getSections: () => content.getSections(),
        getProjects: () => content.getProjects(),
        async enrich(
            projects: Awaited<ReturnType<ContentService['getProjects']>>
        ): Promise<PortfolioProject[]> {
            return Promise.all(
                projects.map(async (project) => ({
                    ...project,
                    metadata: await github.getRepository(project.owner, project.repo),
                }))
            );
        },
    };
}
export type PortfolioService = ReturnType<typeof createPortfolioService>;

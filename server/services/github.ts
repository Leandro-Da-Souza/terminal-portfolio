import { Octokit } from 'octokit';
import type { ProjectType, PortfolioProject } from '../../shared/types/project'
import { FeaturedProjects } from '../../shared/data/projects'

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

function normalizeRepoName(value: string) : string {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '');
}

export async function getRepositories(): Promise<PortfolioProject[]> {
    try {
        const response =
            await octokit.request(
                'GET /users/{username}/repos',
                {
                    username: 'Leandro-Da-Souza',
                    per_page: 100,
                }
        );

        const repositories = response.data.map(repo => ({
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
        } satisfies ProjectType ));

        return FeaturedProjects.map(featured => {
                const repo = repositories.find(
                    repository =>
                        normalizeRepoName(repository.name) 
                            ===
                        normalizeRepoName(featured.repo)
                );
        
                if (!repo) {
                    console.log(
                        'could not find repo for',
                        featured
                    );
        
                    return null;
                }
        
                return {
                    ...repo,
                    name: repo.name,
                    description:
                        featured.descriptionOverride ??
                        repo.description,
                    priority:
                        featured.priority,
                };
            })
            .filter((project): project is PortfolioProject => project !== null);

    } catch {
        throw new Error('Failed To fetch repositories')
    }
};

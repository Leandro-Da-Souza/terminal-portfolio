import { Octokit } from 'octokit';
import { FeaturedProjects } from '../../shared/data/projects.js';
const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});
function normalizeRepoName(value) {
    return value
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '');
}
let cachedprojects = null;
let cachedTimestamp = 0;
const CACHE_DURATION = 1000 * 60 * 5;
export async function getRepositories() {
    if (cachedprojects && Date.now() - cachedTimestamp < CACHE_DURATION) {
        return cachedprojects;
    }
    try {
        const response = await octokit.request('GET /users/{username}/repos', {
            username: 'Leandro-Da-Souza',
            per_page: 100,
        });
        const repositories = response.data.map((repo) => ({
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
            topics: repo.topics ?? [],
        }));
        const projects = FeaturedProjects.filter((project) => project.feature)
            .map((featured) => {
            const repo = repositories.find((repository) => normalizeRepoName(repository.name) === normalizeRepoName(featured.repo));
            if (!repo) {
                console.log('could not find repo for', featured);
                return null;
            }
            return {
                ...repo,
                name: repo.name,
                displayName: featured.displayName,
                description: repo.description,
                priority: featured.priority,
            };
        })
            .filter((project) => project !== null)
            .sort((a, b) => a.priority - b.priority);
        cachedprojects = projects;
        cachedTimestamp = Date.now();
        return projects;
    }
    catch {
        throw new Error('Failed To fetch repositories');
    }
}
export async function getProject(lookup) {
    const projects = await getRepositories();
    const projectNumber = Number(lookup);
    if (!Number.isNaN(projectNumber)) {
        return projects.find((p) => p.priority === projectNumber) ?? null;
    }
    return (projects.find((p) => normalizeRepoName(p.displayName) === normalizeRepoName(lookup)) ?? null);
}

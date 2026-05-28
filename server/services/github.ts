import { Octokit } from 'octokit';

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

export async function getRepositories() {
    try {
        const response =
            await octokit.request(
                'GET /users/{username}/repos',
                {
                    username:
                        'Leandro-Da-Souza',
                }
        );

        return response.data.map(repo => ({
            name: repo.name,
            description: repo.description,
            url: repo.html_url,
        }));

    } catch {
        throw new Error('Failed To fetch repositories')
    }
};
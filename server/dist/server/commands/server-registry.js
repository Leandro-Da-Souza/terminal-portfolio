import { getProject, getRepositories } from '../services/github.js';
import { PortfolioData } from '../../shared/data/portfolio.js';
export const ServerCommandRegistry = {
    about: {
        execute: () => {
            return {
                type: 'output',
                output: PortfolioData.about,
            };
        },
    },
    skills: {
        execute() {
            return {
                type: 'output',
                output: PortfolioData.skills,
            };
        },
    },
    experience: {
        execute() {
            return {
                type: 'output',
                output: PortfolioData.experience,
            };
        },
    },
    contact: {
        execute() {
            return {
                type: 'output',
                output: PortfolioData.contact,
            };
        },
    },
    projects: {
        execute: async () => {
            const projects = await getRepositories();
            return {
                type: 'output',
                output: [
                    'AVAILABLE PROJECTS',
                    '──────────────────',
                    '',
                    ...projects.map((project) => `[${project.priority}] ${project.displayName}`),
                    '',
                    'Use: project <name|number>',
                ].join('\n'),
            };
        },
    },
    project: {
        execute: async (args = []) => {
            if (args.length === 0) {
                return {
                    type: 'output',
                    output: 'Usage: project <name|number>',
                };
            }
            const project = await getProject(args.join(' '));
            if (!project) {
                return {
                    type: 'output',
                    output: 'Project not found.',
                };
            }
            return {
                type: 'output',
                output: [
                    project.displayName,
                    '',
                    project.description,
                    'Technologies',
                    '────────────',
                    '',
                    ...project.topics,
                    '',
                    'Repository',
                    '──────────',
                    '',
                    project.url,
                ].join('\n'),
            };
        },
    },
    'machine-spirit': {
        execute: async () => {
            return {
                type: 'mode',
                mode: 'machine-spirit',
                endpoint: '/terminal/machine-spirit',
            };
        },
    },
};

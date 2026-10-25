import type { CommandRegistryType } from '../../shared/types/command.js';
import { normalizeProjectName, type PortfolioService } from '../services/portfolio.js';

export function createServerCommandRegistry(portfolio: PortfolioService): CommandRegistryType {
    const sections = Object.fromEntries(
        (['about', 'skills', 'experience', 'contact'] as const).map((key) => [
            key,
            {
                execute: async () => ({
                    type: 'output' as const,
                    output: (await portfolio.getSections())[key],
                }),
            },
        ])
    );
    return {
        ...sections,
        projects: {
            execute: async () => {
                const projects = await portfolio.getProjects();
                return {
                    type: 'output',
                    output: [
                        'AVAILABLE PROJECTS',
                        '──────────────────',
                        '',
                        ...projects.map((p) => `[${p.position}] ${p.displayName}`),
                        ...(projects.length ? [] : ['No featured projects yet.']),
                        '',
                        'Use: project <name|number>',
                    ].join('\n'),
                };
            },
        },
        project: {
            execute: async (args = []) => {
                if (!args.length) return { type: 'output', output: 'Usage: project <name|number>' };
                const lookup = args.join(' ');
                const projects = await portfolio.getProjects();
                const matches = /^\d+$/.test(lookup)
                    ? projects.filter((p) => p.position === Number(lookup))
                    : projects.filter(
                          (p) =>
                              normalizeProjectName(p.displayName) === normalizeProjectName(lookup)
                      );
                if (!matches.length) return { type: 'output', output: 'Project not found.' };
                if (matches.length > 1)
                    return {
                        type: 'output',
                        output: 'More than one project has that name. Use the number shown by projects.',
                    };
                const [p] = await portfolio.enrich(matches);
                return {
                    type: 'output',
                    output: [
                        p.displayName,
                        '',
                        p.metadata?.description ??
                            (p.metadata
                                ? 'No description provided on GitHub.'
                                : 'GitHub metadata temporarily unavailable. Please try again.'),
                        'Technologies',
                        '────────────',
                        '',
                        ...(p.metadata?.topics ?? []),
                        '',
                        'Repository',
                        '──────────',
                        '',
                        p.metadata?.url ?? 'Temporarily unavailable.',
                    ].join('\n'),
                };
            },
        },
        'machine-spirit': {
            execute: () => ({
                type: 'mode',
                mode: 'machine-spirit',
                endpoint: '/terminal/machine-spirit',
            }),
        },
    };
}

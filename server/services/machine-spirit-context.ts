import type { PortfolioService } from './portfolio.js';

// Used by the real OpenAI request and the no-charge context inspection command.
export async function buildMachineSpiritContext(
    portfolio: PortfolioService,
    includeProjects = true
): Promise<string> {
    const sections = await portfolio.getSections();
    const blocks = [
        `ABOUT\n\n${sections.about}`,
        `PERSONAL INTERESTS\n\n${sections.interests}`,
        `EXPERIENCE\n\n${sections.experience}`,
        `SKILLS\n\n${sections.skills}`,
        `CONTACT\n\n${sections.contact}`,
    ];
    if (includeProjects) {
        const projects = await portfolio.enrich(await portfolio.getProjects());
        blocks.push(
            'PROJECTS\n\n' +
                projects
                    .map((p) =>
                        [
                            `[${p.position}] ${p.displayName}`,
                            p.metadata?.description ??
                                (p.metadata
                                    ? 'No description provided on GitHub.'
                                    : 'GitHub metadata temporarily unavailable.'),
                            `Technologies: ${p.metadata?.topics.join(', ') || 'Not available'}`,
                            `Repository: ${p.metadata?.url ?? 'Not available'}`,
                        ].join('\n')
                    )
                    .join('\n\n')
        );
    }
    return blocks.join('\n\n');
}

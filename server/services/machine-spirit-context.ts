import { PortfolioData } from '../../shared/data/portfolio';
import { getRepositories } from './github';

export async function buildMachineSpiritContext(inputQuery: string): Promise<string> {
    const contextSections = [
        getAboutContext(),
        getExperienceContext(),
        getSkillsContext(),
        getContactContext(),
        await getProjectsContext(),
    ];

    return contextSections.join(`\n\n`);
}

async function getProjectsContext(): Promise<string> {
    const projects = await getRepositories();

    const projectContext = projects
        .map((project) =>
            `
                ${project.displayName}

                ${project.description}

                Technologies:
                ${project.topics.join(', ')}
                `.trim()
        )
        .join('\n\n');

    return `
        PROJECTS
        
        ${projectContext}
        `.trim();
}

function getContactContext(): string {
    return `
    CONTACT

    ${PortfolioData.contact}
    `.trim();
}

function getAboutContext(): string {
    return `
    ABOUT

    ${PortfolioData.about}

    PERSONAL INTERESTS

    - Coding
    - Running
    - Reading
    - Muay Thai
    `.trim();
}

function getExperienceContext(): string {
    return `
    EXPERIENCE

    ${PortfolioData.experience}
    `.trim();
}

function getSkillsContext(): string {
    return `
    SKILLS
    ${PortfolioData.skills}
    `.trim();
}

import { PortfolioData } from '../../shared/data/portfolio.js';
import { getRepositories } from './github.js';
export async function buildMachineSpiritContext(inputQuery) {
    const contextSections = [
        getAboutContext(),
        getExperienceContext(),
        getSkillsContext(),
        getContactContext(),
        await getProjectsContext(),
    ];
    return contextSections.join(`\n\n`);
}
async function getProjectsContext() {
    const projects = await getRepositories();
    const projectContext = projects
        .map((project) => `
                ${project.displayName}

                ${project.description}

                Technologies:
                ${project.topics.join(', ')}
                `.trim())
        .join('\n\n');
    return `
        PROJECTS
        
        ${projectContext}
        `.trim();
}
function getContactContext() {
    return `
    CONTACT

    ${PortfolioData.contact}
    `.trim();
}
function getAboutContext() {
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
function getExperienceContext() {
    return `
    EXPERIENCE

    ${PortfolioData.experience}
    `.trim();
}
function getSkillsContext() {
    return `
    SKILLS
    ${PortfolioData.skills}
    `.trim();
}

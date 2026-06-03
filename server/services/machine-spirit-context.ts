import { PortfolioData } from "../../shared/data/portfolio";
import { getRepositories } from "./github";

export async function buildMachineSpiritContext() {
    const projects =
        await getRepositories();

    const projectContext =
        projects
            .map(project =>
                `
${project.displayName}

${project.description}

Technologies:
${project.topics.join(', ')}
`
            )
            .join('\n\n');

    return `
ABOUT
${PortfolioData.about}

SKILLS
${PortfolioData.skills}

EXPERIENCE
${PortfolioData.experience}

CONTACT
${PortfolioData.contact}

PROJECTS
${projectContext}
`;
}
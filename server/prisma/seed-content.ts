import type { PrismaClient } from '@prisma/client';
import { initialSections, initialProjects } from './initial-content.js';

export async function seedContent(db: PrismaClient) {
    return db.$transaction(async (tx) => {
        const sections = await tx.contentSection.createMany({
            data: initialSections,
            skipDuplicates: true,
        });
        // Stable IDs also prevent reinserting a seed project after its owner/name is edited.
        const projects = await tx.featuredProject.createMany({
            data: initialProjects,
            skipDuplicates: true,
        });
        return { sections: sections.count, projects: projects.count };
    });
}

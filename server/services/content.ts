import type { PrismaClient } from '@prisma/client';
import type { ProjectCuration } from '../../shared/types/project.js';

export const SECTION_KEYS = ['about', 'skills', 'experience', 'contact', 'interests'] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];
export type Sections = Record<SectionKey, string>;
export const CONTENT_CACHE_MS = 30_000;

export class ContentUnavailableError extends Error {
    constructor() {
        super('Portfolio content is temporarily unavailable. Please try again.');
    }
}

export type ContentStore = {
    readSections(): Promise<{ key: string; body: string }[]>;
    readProjects(): Promise<ProjectCuration[]>;
};

export function prismaContentStore(db: PrismaClient): ContentStore {
    return {
        readSections: () => db.contentSection.findMany(),
        readProjects: () =>
            db.featuredProject.findMany({
                where: { featured: true },
                orderBy: { position: 'asc' },
            }),
    };
}

// A failed or missing-content read is never cached or replaced by old seed text.
// Generation checks prevent an in-flight pre-edit read from repopulating the cache.
export function createContentService(store: ContentStore, now = Date.now) {
    let sections: { value: Sections; expires: number } | undefined;
    let projects: { value: ProjectCuration[]; expires: number } | undefined;
    let generation = 0;
    return {
        invalidate() {
            generation++;
            sections = undefined;
            projects = undefined;
        },
        async getSections(): Promise<Sections> {
            if (sections && sections.expires > now()) return { ...sections.value };
            const started = generation;
            try {
                const rows = await store.readSections();
                const value = {} as Sections;
                for (const key of SECTION_KEYS) {
                    const row = rows.find((item) => item.key === key);
                    if (!row?.body.trim()) throw new ContentUnavailableError();
                    value[key] = row.body;
                }
                if (generation === started) sections = { value, expires: now() + CONTENT_CACHE_MS };
                return { ...value };
            } catch {
                throw new ContentUnavailableError();
            }
        },
        async getProjects(): Promise<ProjectCuration[]> {
            if (projects && projects.expires > now()) return projects.value.map((p) => ({ ...p }));
            const started = generation;
            try {
                const value = (await store.readProjects())
                    .filter((p) => p.featured)
                    .sort((a, b) => a.position - b.position);
                if (generation === started) projects = { value, expires: now() + CONTENT_CACHE_MS };
                return value.map((p) => ({ ...p }));
            } catch {
                throw new ContentUnavailableError();
            }
        },
    };
}
export type ContentService = ReturnType<typeof createContentService>;

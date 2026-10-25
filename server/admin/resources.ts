import AdminJS, {
    ValidationError,
    type ResourceWithOptions,
    type ActionContext,
    type ActionRequest,
} from 'adminjs';
import { Database, Resource, getModelByName } from '@adminjs/prisma';
import type { PrismaClient } from '@prisma/client';
import type { ContentService } from '../services/content.js';
import { InputError, projectInput, sectionInput } from './validation.js';

// Adapter writes still use Prisma. This thin extension adds server-side allowlists,
// readable constraint errors (including races), and cache invalidation after commit.
export class ContentResource extends Resource {
    private invalidate: () => void;
    constructor(args: ConstructorParameters<typeof Resource>[0] & { invalidate?: () => void }) {
        super(args);
        this.invalidate = args.invalidate ?? (() => {});
    }
    private async write(operation: () => Promise<Record<string, unknown>>) {
        try {
            const result = await operation();
            this.invalidate();
            return result;
        } catch (error) {
            if (error instanceof InputError) {
                throw new ValidationError(
                    Object.fromEntries(
                        Object.entries(error.fields).map(([key, message]) => [key, { message }])
                    )
                );
            }
            if ((error as { code?: string }).code === 'P2002') {
                const target = (error as { meta?: { target?: string[] } }).meta?.target ?? [];
                throw new ValidationError(
                    target.includes('position')
                        ? {
                              position: {
                                  message:
                                      'This position is already used, including by hidden projects. Choose an unused number.',
                              },
                          }
                        : { repo: { message: 'This owner/repository already exists.' } }
                );
            }
            // Never expose connection strings or Prisma's query diagnostics to browsers.
            throw new ValidationError({
                base: {
                    message: 'Save failed. Check database availability and the entered values.',
                },
            });
        }
    }
    override async create(params: Record<string, unknown>) {
        return this.write(() => super.create(projectInput(params)));
    }
    override async update(id: string | number, params: Record<string, unknown>) {
        return this.write(() =>
            super.update(
                id,
                this.id() === 'ContentSection' ? sectionInput(params) : projectInput(params)
            )
        );
    }
}

AdminJS.registerAdapter({ Database, Resource: ContentResource });

export function contentResources(db: PrismaClient, content: ContentService): ResourceWithOptions[] {
    const authenticated = ({ currentAdmin }: ActionContext) => Boolean(currentAdmin);
    const before = (request: ActionRequest, context: ActionContext): ActionRequest => {
        if (request.method !== 'post') return request;
        try {
            const payload =
                context.resource.id() === 'ContentSection'
                    ? sectionInput(request.payload ?? {})
                    : projectInput(request.payload ?? {});
            return { ...request, payload };
        } catch (error) {
            if (error instanceof InputError)
                throw new ValidationError(
                    Object.fromEntries(
                        Object.entries(error.fields).map(([key, message]) => [key, { message }])
                    )
                );
            throw error;
        }
    };
    const actions = {
        list: { isAccessible: authenticated },
        show: { isAccessible: authenticated },
        search: { isAccessible: authenticated },
        edit: { isAccessible: authenticated, before },
        delete: { isAccessible: false, isVisible: false },
        bulkDelete: { isAccessible: false, isVisible: false },
    };
    const hidden = { isVisible: { list: false, filter: false, show: true, edit: false } };
    return [
        {
            resource: {
                model: getModelByName('ContentSection'),
                client: db,
                invalidate: () => content.invalidate(),
            },
            options: {
                navigation: { name: 'Portfolio' },
                listProperties: ['key', 'updatedAt'],
                editProperties: ['body'],
                showProperties: ['key', 'body', 'updatedAt'],
                properties: {
                    key: { isTitle: true, isDisabled: true },
                    body: { type: 'textarea', props: { rows: 22 } },
                    updatedAt: hidden,
                },
                actions: { ...actions, new: { isAccessible: false, isVisible: false } },
            },
        },
        {
            resource: {
                model: getModelByName('FeaturedProject'),
                client: db,
                invalidate: () => content.invalidate(),
            },
            options: {
                navigation: { name: 'Portfolio' },
                sort: { sortBy: 'position', direction: 'asc' },
                listProperties: ['position', 'displayName', 'owner', 'repo', 'featured'],
                editProperties: ['owner', 'repo', 'displayName', 'featured', 'position'],
                properties: {
                    id: hidden,
                    updatedAt: hidden,
                    displayName: { isTitle: true },
                    position: {
                        description:
                            'Unique across all projects. Use a temporary unused position to swap two projects.',
                    },
                    owner: { description: 'GitHub user or organization. Stored lowercase.' },
                    repo: {
                        description:
                            'Repository name only. Descriptions, topics and URLs are fetched from GitHub.',
                    },
                    featured: {
                        description:
                            'Hide instead of deleting. Hidden projects keep their position.',
                    },
                },
                actions: { ...actions, new: { isAccessible: authenticated, before } },
            },
        },
    ];
}

export type ProjectCuration = {
    id: string;
    owner: string;
    repo: string;
    displayName: string;
    featured: boolean;
    position: number;
};

export type GithubRepository = {
    description: string | null;
    url: string;
    topics: string[];
};

export type PortfolioProject = ProjectCuration & {
    metadata: GithubRepository | null;
};

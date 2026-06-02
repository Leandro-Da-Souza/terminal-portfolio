export type GithubRepository = {
    name: string,
    description: string | null,
    url: string
    topics: string[]
}

export type ProjectMetaData = {
    repo: string,
    displayName: string
    feature: boolean,
    priority: number,
}

export type PortfolioProject = {
    name: string;
    description: string | null;
    displayName: string
    url: string;
    priority: number;
    topics: string[]
}
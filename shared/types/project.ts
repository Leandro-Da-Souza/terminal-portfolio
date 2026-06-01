export type ProjectType = {
    name: string,
    description: string | null,
    url: string
}

export type ProjectMetaData = {
    repo: string,
    displayName: string
    feature: boolean,
    priority: number,
    descriptionOverride?: string 
}

export type PortfolioProject = {
    name: string;
    description: string | null;
    displayName: string
    url: string;
    priority: number;
}
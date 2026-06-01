export type ProjectType = {
    name: string,
    description: string | null,
    url: string
}

export type ProjectMetaData = {
    repo: string,
    feature: boolean,
    priority: number,
    descriptionOverride?: string 
}

export type PortfolioProject = {
    name: string;
    description: string | null;
    url: string;
    priority: number;
}
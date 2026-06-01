import type { ProjectMetaData } from '../types/project'

export const FeaturedProjects: ProjectMetaData[] = [
    {
        repo: 'examensarbete',
        displayName: 'Plantera Mera',
        feature: true,
        priority: 1,
        descriptionOverride: 'Homepage for the ficticious company "Plantera Mera", part of examinationproject for higher vocational study finals'
    },
    {
        repo: 'terminal-portfolio',
        displayName: 'Terminal Portfolio',
        feature: true,
        priority: 2,
        descriptionOverride: 'Stylized portfolio page with inspiration coming from old school terminals and WH40k mechanicus faction'
    },
    {
        repo: 'airbean',
        displayName: 'Airbean',
        feature: true,
        priority: 3, 
        descriptionOverride: 'Fullstack project for fictious company AirBean, a online coffee shop.'
    }
]
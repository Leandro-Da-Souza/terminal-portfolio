import type { CommandMetaDataType } from '../types/command'

export const CommandMetaData: Record<string, CommandMetaDataType> = {
    help: {
        description: 'List available commands',
        scope: 'client'
    },
    clear: {
        description: 'Clear the terminal',
        scope: 'client'
    },
    theme: {
        description: 'Set current theme for the terminal',
        scope: 'client'
    },
    exit: {
        description: 'Shutdown the terminal',
        scope: 'client'
    },
    about: {
        description: 'Learn more about me',
        scope: 'server'
    },
    skills: {
        description: 'View technical skills and technologies',
        scope: 'server'
    },
    experience: {
        description: 'View professional experience',
        scope: 'server'
    },
    contact: {
        description: 'View contact information and links',
        scope: 'server'
    },
    projects: {
        description: 'View my projects',
        scope: 'server'
    },
}
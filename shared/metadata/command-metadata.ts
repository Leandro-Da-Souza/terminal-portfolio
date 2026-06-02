import type { CommandMetaDataType } from '../types/command'

export const CommandMetaData: Record<string, CommandMetaDataType> = {
    help: {
        description: 'List available commands',
        scope: 'client',
        transport: 'local'
    },
    clear: {
        description: 'Clear the terminal',
        scope: 'client',
        transport: 'local'
    },
    theme: {
        description: 'Set current theme for the terminal',
        scope: 'client',
        transport: 'local'
    },
    exit: {
        description: 'Shutdown the terminal',
        scope: 'client',
        transport: 'local'
    },
    about: {
        description: 'Learn more about me',
        scope: 'server',
        transport: 'request'
    },
    skills: {
        description: 'View technical skills and technologies',
        scope: 'server',
        transport: 'request'
    },
    experience: {
        description: 'View professional experience',
        scope: 'server',
        transport: 'request'
    },
    contact: {
        description: 'View contact information and links',
        scope: 'server',
        transport: 'request'
    },
    projects: {
        description: 'View my projects',
        scope: 'server',
        transport: 'request'
    },
    project: {
        description: 'view details about a project',
        scope: 'server',
        transport: 'request'
    },
    stream: {
        description: 'Temp streaming channel',
        scope: 'client',
        transport: 'stream'
    }
}
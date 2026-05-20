import type { CommandRegistryType } from '../types/command';


export const CommandRegistry: CommandRegistryType = {
    help: {
        description: 'List available commands',
        execute: (_, registry) => {
            if(!registry) {
                return 'Available commands: help, about, projects';
            }
            return Object.entries(registry)
                .map(([name, command]) => {
                    return `${name} - ${command.description}`
                })
                .join('\n');
        }
    },
    about: {
        description: 'Learn more about me',
        execute: () => {
            return 'I am a software developer with a passion for creating interactive web applications.';
        }
    },
    projects: {
        description: 'View my projects',
        execute: () => {
            return 'Here are some of my projects:\n- Project A\n- Project B\n- Project C';
        }
    },
    clear: {
        description: 'Clear the terminal',
        execute: () => {
            return ''; // This will be handled specially in the terminal component to clear the display
        }
    },
    default: {
        description: 'Default response for unknown commands',
        execute: () => {
            return 'Command not found. Type "help" to see available commands.';
        }
    }
}
import type { CommandRegistryType } from '../types/command';

export const CommandRegistry: CommandRegistryType = {
    help: {
        description: 'List available commands',

        execute: (_, registry) => {
            if (!registry) {
                return {
                    type: 'output',
                    output: 'This was not supposed to happen...',
                };
            }

            return {
                type: 'output',

                output: Object.entries(registry)
                    .map(([name, command]) => {
                        return `${name} - ${command.description}`;
                    })
                    .join('\n'),
            };
        },
    },
    about: {
        description: 'Learn more about me',
        execute: () => {
            return {
                type: 'output',
                output: 'I am a software developer with a passion for creating interactive web applications.',
            };
        },
    },
    projects: {
        description: 'View my projects',
        execute: () => {
            return {
                type: 'output',
                output: 'Here are some of my projects:\n- Project A\n- Project B\n- Project C',
            };
        },
    },
    clear: {
        description: 'Clear the terminal',
        execute: () => {
            return { type: 'effect', effect: 'clear' };
            // This will be handled specially in the terminal component to clear the display
        },
    },
    default: {
        description: 'Default response for unknown commands',
        execute: () => {
            return {
                type: 'output',
                output: 'Command not found. Type "help" to see available commands.',
            };
        },
    },
};

export const BootRegistry: CommandRegistryType = {
    init: {
        description: 'First sequence of the bootloader.',
        execute: () => {
            return {
                type: 'output',
                output: 'INITIALIZING MACHINE SPIRIT...',
                variant: 'system',
            };
        },
    },
    loading: {
        description: 'Second sequence of the bootloader',
        execute: () => {
            return {
                type: 'output',
                output: 'LOADING NOOSPHERIC INDEX...',
                variant: 'system',
            };
        },
    },
    verify: {
        description: 'Third sequence of the bootloader.',
        execute: () => {
            return {
                type: 'output',
                output: 'VERIFYING PROTOCOLS...',
                variant: 'system',
            };
        },
    },
    online: {
        description: 'Final sequence of the bootloader',
        execute: () => {
            return {
                type: 'output',
                output: 'SYSTEM ONLINE.',
                variant: 'system',
            };
        },
    },
};

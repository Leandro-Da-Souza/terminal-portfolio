import type { CommandRegistryType } from '../../../shared/types/command';

export const ClientCommandRegistry: CommandRegistryType = {
    help: {
        execute: (_, metadata) => {
            if (!metadata) {
                return {
                    type: 'output',
                    output: 'This was not supposed to happen...',
                };
            }

            return {
                type: 'output',

                output: Object.entries(metadata)
                    .map(([name, command]) => {
                        if(name === 'default') return;
                        return `${name} - ${command.description}`;
                    })
                    .join('\n'),
            };
        },
    },
    clear: {
        execute: () => {
            return { type: 'effect', effect: 'clear' };
        },
    },
    theme: {    
        execute: (args) => {
            const themes: string[] = [
                'rust',
                'matrix',
                'frost'
            ];
    
            if (!args || args.length === 0) {
    
                return {
                    type: 'output',
                    output:
                        'Please set a valid theme:\n' +
                        '- theme rust\n' +
                        '- theme matrix\n' +
                        '- theme frost'
                };
            }
    
            const selectedTheme = args[0];
    
            if (!themes.includes(selectedTheme)) {
                return {
                    type: 'output',
                    output:
                        `"${selectedTheme}" is not a valid theme`
                };
            }
    
            return {
                type: 'effect',
                effect: 'theme-change',
                output: `Theme changed to ${selectedTheme}`,
                parameter: selectedTheme,
            };
        }
    },
    exit: {
        execute: () => {
            return {
                type: 'effect',
                effect: 'shutdown'
            }
        }
    },
    default: {
        execute: () => {
            return {
                type: 'output',
                output: 'Command not found. Type "help" to see available commands.',
            };
        },
    },
};

// Stupid fun
export const BootRegistry: CommandRegistryType = {
    init: {
        execute: () => {
            return {
                type: 'output',
                output: 'INITIALIZING MACHINE SPIRIT...',
                variant: 'system',
            };
        },
    },
    loading: {
        execute: () => {
            return {
                type: 'output',
                output: 'LOADING NOOSPHERIC INDEX...',
                variant: 'system',
            };
        },
    },
    verify: {
        execute: () => {
            return {
                type: 'output',
                output: 'VERIFYING PROTOCOLS...',
                variant: 'system',
            };
        },
    },
    online: {
        execute: () => {
            return {
                type: 'output',
                output: 'SYSTEM ONLINE.',
                variant: 'system',
            };
        },
    },
};

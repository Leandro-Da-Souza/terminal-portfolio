import type { CommandRegistryType } from '../../../shared/types/command.js';
import { isTheme, Themes } from '../../../shared/types/theme.js'

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
                        if (name === 'default') return;
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
            if (!args || args.length === 0) {
                return {
                    type: 'output',
                    output:
                        'Please set a valid theme:\n' +
                        Themes.map(theme => `- theme ${theme}`).join('\n')
                };
            }

            const selectedTheme = args[0];

            if (!isTheme(selectedTheme)) {
                return {
                    type: 'output',
                    output: 'Please set a valid theme:\n' +
                    Themes.map(theme => `- theme ${theme}`).join('\n')
                };
            }

            return {
                type: 'effect',
                effect: 'theme-change',
                output: `Theme changed to ${selectedTheme}`,
                parameter: selectedTheme,
            };
        },
    },
    exit: {
        execute: () => {
            return {
                type: 'effect',
                effect: 'shutdown',
            };
        },
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

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
                        if(name === 'default') return;
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
    
                output:
`Leandro Da Souza
Software developer based in Stockholm, Sweden.

Interested in interactive UI systems,
real-time applications, frontend architecture,
and modern web technologies.

Use:
- skills
- experience
- contact

to learn more.`.trim()
            };
        },
    },
    skills: {
        description: 'View technical skills and technologies',
    
        execute() {
            return {
                type: 'output',
    
                output:
`Frontend
─────────
TypeScript
JavaScript
Vue 2 / Vue 3
React
Web Components
HTML / CSS / SASS
Bootstrap
jQuery

Backend / APIs
──────────────
PHP
Laravel
REST APIs
GraphQL
WebSockets
Redis

Infrastructure / Tooling
────────────────────────
Docker
Nginx
Git / GitLab
CI/CD pipelines
MySQL
Postman

Also explored
──────────────
React Native
Angular
Nuxt
Next`.trim()
            };
        }
    },
    experience: {
        description: 'View professional experience',
    
        execute() {
            return {
                type: 'output',
    
                output:
`4+ years building high-traffic web applications
within the iGaming industry and large-scale
multi-brand platform environments.

Worked extensively with modern TypeScript/Vue
frontend systems integrated into legacy PHP
platforms, focusing on scalable UI architecture,
real-time systems, and production reliability.

Hands-on experience across frontend, backend,
and infrastructure-adjacent work including:

- Docker environments
- REST & WebSocket integrations
- Redis caching
- MySQL / database handling
- CI/CD workflows
- Legacy modernization
- Theming systems
- Component architecture

Comfortable collaborating across product,
design, QA, and backend teams while shipping
production-grade features at scale.`.trim()
            };
        }
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
    contact: {
        description: 'View contact information and links',
    
        execute() {
            return {
                type: 'output',
    
                output:
`GitHub
https://github.com/Leandro-Da-Souza

LinkedIn
https://linkedin.com/in/leandro-da-souza

Email
dasouza.leandro@gmail.com`.trim()
            };
        }
    },
    clear: {
        description: 'Clear the terminal',
        execute: () => {
            return { type: 'effect', effect: 'clear' };
        },
    },
    theme: {
        description: 'Set current theme for the terminal',
    
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
        description: 'Shutdown the terminal',
        execute: () => {
            return {
                type: 'effect',
                effect: 'shutdown'
            }
        }
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

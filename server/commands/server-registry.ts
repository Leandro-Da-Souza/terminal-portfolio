import type { CommandRegistryType } from '../../shared/types/command';

export const ServerCommandRegistry: CommandRegistryType = {
    about: {
        execute: () => {
            return {
                type: 'output',
                output: `Leandro Da Souza
Software developer based in Stockholm, Sweden.

Interested in interactive UI systems,
real-time applications, frontend architecture,
and modern web technologies.

Use:
- skills
- experience
- contact

to learn more.`.trim(),
            };
        },
    },
    skills: {
        execute() {
            return {
                type: 'output',

                output: `Frontend
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
Next`.trim(),
            };
        },
    },

    experience: {
        execute() {
            return {
                type: 'output',

                output: `4+ years building high-traffic web applications
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
production-grade features at scale.`.trim(),
            };
        },
    },
    contact: {
        execute() {
            return {
                type: 'output',

                output: `GitHub
https://github.com/Leandro-Da-Souza

LinkedIn
https://linkedin.com/in/leandro-da-souza

Email
dasouza.leandro@gmail.com`.trim(),
            };
        },
    },
    projects: {
        execute: () => {
            return {
                type: 'output',
                output: 'Here are some of my projects:\n- Project A\n- Project B\n- Project C',
            };
        },
    },
};

const portfolio = {
    about: `
Leandro Da Souza
Software developer based in Stockholm, Sweden.

Interested in interactive UI systems,
real-time applications, frontend architecture,
and modern web technologies.

Use:
- skills
- experience
- contact

to learn more.`.trim(),
    skills: `
Frontend
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
    experience: `
4+ years building high-traffic web applications
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
    contact: `
GitHub
https://github.com/Leandro-Da-Souza

LinkedIn
https://linkedin.com/in/leandro-da-souza

Email
dasouza.leandro@gmail.com`.trim(),
};
export const initialSections = [
    ...Object.entries(portfolio).map(([key, body]) => ({ key, body })),
    { key: 'interests', body: '- Coding\n- Running\n- Reading\n- Muay Thai' },
];

// Owners verified through GitHub's repository API on 2026-10-24.
export const initialProjects = [
    {
        id: 'seed-comboforge',
        owner: 'leandro-da-souza',
        repo: 'comboforge',
        displayName: 'ComboForge',
        featured: true,
        position: 1,
    },
    {
        id: 'seed-terminal-portfolio',
        owner: 'leandro-da-souza',
        repo: 'terminal-portfolio',
        displayName: 'Terminal Portfolio',
        featured: true,
        position: 2,
    },
    {
        id: 'seed-examensarbete',
        owner: 'leandro-da-souza',
        repo: 'examensarbete',
        displayName: 'Plantera Mera',
        featured: true,
        position: 3,
    },
    {
        id: 'seed-airbean',
        owner: 'leandro-da-souza',
        repo: 'airbean',
        displayName: 'Airbean',
        featured: true,
        position: 4,
    },
    {
        id: 'seed-grammer-assistant',
        owner: 'null-inc',
        repo: 'grammer-assistant',
        displayName: 'Grammer Assistant',
        featured: true,
        position: 5,
    },
];

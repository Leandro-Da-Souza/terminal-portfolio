import type { TerminalEntry } from '../types/terminal';
import type { ParsedCommand } from '../types/command';

class TerminalWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }
    
    private history: TerminalEntry[] = [];

    protected render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.styles()}
            ${this.markup()}
        `;

        this.attachEventListeners();
    }

    protected styles(): string {
        return `
            <style>
                .terminal-window {
                    background-color: #222;
                    color: #0f0;
                    font-family: 'Courier New', Courier, monospace;
                    min-width: 100dvw;
                    min-height: 100dvh;
                    overflow: hidden;
                }
            </style>
        `;
    }

    protected markup(): string {
        return `
            <section class="terminal-window">
                <main>
                    <terminal-header></terminal-header>
                    <section class="content">
                        ${
                            this.history.map(entry => `
                                <div>
                                    <span>${entry.input}</span>
                                    <br/>
                                    <span>${entry.output}</span>
                                </div>`).join('')
                        }
                        <p>Type 'help' to see available commands.</p>
                        <terminal-input></terminal-input>
                    </section>
                </main>
            </section>
        `;
    }

    protected attachEventListeners(): void {
        // Listen for minimize and close events from the header
        this.shadowRoot?.addEventListener('minimize', () => {
            console.log('Minimize event received');
            // Implement minimize logic here
        });

        this.shadowRoot?.addEventListener('maximize', () => {
            console.log('Maximize event received');
            // Implement maximize logic here
        });

        this.shadowRoot?.addEventListener('close', () => {
            console.log('Close event received');
            // Implement close logic here
        });

        // Listen for command events from the input
        this.shadowRoot?.addEventListener('command', (event: Event) => {
            const customEvent = event as CustomEvent<ParsedCommand>;
            const command = customEvent.detail;
            this.handleCommandListener(command);
        });

    }

    private handleCommandListener(command: ParsedCommand): void {
        // Implement command parsing and execution logic here
        const { input, output } = this.parseTerminalEntry(command);

        this.history.push({ input, output });
        // Update the terminal display with the new output
        this.render();
    }

    private parseTerminalEntry(command: ParsedCommand): TerminalEntry {
        // Implement command parsing logic here
        const output = `Executed command: ${command.name}`; // Placeholder output
        return { input: command.name, output };
    }

}

customElements.define('terminal-window', TerminalWindow);     
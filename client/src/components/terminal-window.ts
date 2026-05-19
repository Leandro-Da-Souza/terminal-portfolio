import type { TerminalEntry } from '../types/terminal';
import type { ParsedCommand } from '../types/command';
import { CommandRegistry } from '../commands/registry';

class TerminalWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }
    
    private history: TerminalEntry[] = [];

    protected render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.styles()}
            ${this.markup()}
        `;
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
            const customEvent = event as CustomEvent;
            const command = customEvent.detail;
            this.commandHandler(command);
        });
    }

    private commandHandler(command: string): void {
        const parsedCommand = this.parseCommand(command);
    
        const output = this.executeCommand(parsedCommand);
    
        this.addTerminalEntry(parsedCommand, output);
    
        this.render();
    }

    private parseCommand(command: string): ParsedCommand {
        const [name, ...args] = command.split(' ');
        return { name, args };
    }

    private executeCommand(parsedCommand: ParsedCommand): string {
        const commandDef = CommandRegistry[parsedCommand.name] || CommandRegistry['default'];
        return commandDef.execute(parsedCommand.args);
    }

    private addTerminalEntry(
        parsedCommand: ParsedCommand,
        output: string
    ): void {
    
        const input = [
            parsedCommand.name,
            ...(parsedCommand.args || [])
        ].join(' ');
    
        this.history.push({
            input,
            output
        });
    }

}

customElements.define('terminal-window', TerminalWindow);     
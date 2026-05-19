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

        this.attachEventHandlers();
        this.attachEventListeners();
    }

    protected styles(): string {
        return `
            <style>
                .terminal-window {
                    background-color: #222;
                    color: #0f0;
                    font-family: 'Courier New', Courier, monospace;
                    width: 100dvw;
                    height: 100dvh;
                    overflow: hidden;
                }
                .command-input {
                    width: 100%;
                    background-color: transparent;
                    border: none;
                    color: #0f0;
                    font-family: 'Courier New', Courier, monospace;
                }
                .command-input:focus {
                    outline: none;
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
                        <p>Type 'help' to see available commands.</p>
                        <input type="text" class="command-input" placeholder="Enter command..." autofocus />
                    </section>
                </main>
            </section>
        `;
    }

    protected attachEventHandlers(): void {
        this.commandHandler();
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

    }

    private commandHandler(): void {
        // Implement command handling logic here
        const commandInput = this.shadowRoot?.querySelector('.command-input') as HTMLInputElement;
        commandInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const command = commandInput.value.trim();
                if (command) {
                    this.handleCommand(command);
                }
                commandInput.value = '';
            }
        });
    }

    private handleCommand(command: string): void {
        // Implement command parsing and execution logic here
        const parsedCommand: ParsedCommand = this.parseCommand(command);
        console.log('Parsed Command:', parsedCommand);

        // Execute the command and update history
        const output = `Executed command: ${parsedCommand.name}`;
        this.history.push({ input: command, output });
        console.log('Command history:', this.history);
        // Update the terminal display with the new output
    }

    private parseCommand(command: string): ParsedCommand {
        const [name, ...args] = command.split(' ');
        return { name, args };
    }
}

customElements.define('terminal-window', TerminalWindow);     
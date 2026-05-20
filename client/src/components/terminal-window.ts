import type { TerminalEntry } from '../types/terminal';
import type { CommandResult, ParsedCommand } from '../types/command';
import { CommandRegistry } from '../commands/registry';
import { baseStyles } from '../styles/base';

class TerminalWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    private fontSize: number = 14;

    private contentElement: HTMLElement | null = null;

    private history: TerminalEntry[] = [];
    
    connectedCallback() {
        this.render();
        this.attachEventListeners();
        this.contentElement =
            this.shadowRoot!.querySelector('.terminal-content') as HTMLElement | null;
    }
    
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
                ${baseStyles}
                section.terminal-window {
                    background-color: var(--terminal-bg);
                    color: var(--terminal-text);
    
                    font-family: var(--font-terminal);
    
                    width: 100%;
                    height: 100vh;
                    min-height: 100vh;
    
                    overflow: auto;
    
                    padding: var(--space-md);
                }

                main {
                    display: flex;
                    flex-direction: column;
                
                    height: 100%;
                
                    gap: var(--space-md);
                }

                section.terminal-content {
                    flex: 1;

                    display: flex;
                    flex-direction: column;
                
                    gap: var(--space-md);
                
                    overflow-y: auto;
                }
    

            </style>
        `;
    }

    protected markup(): string {
        return `
            <section class="terminal-window">
                <main>
                    <terminal-header></terminal-header>
                    <section class="terminal-content">
                    </section>
                    <span>Type 'help' to see available commands.</span>
                    <terminal-input></terminal-input>
                </main>
            </section>
        `;
    }

    protected attachEventListeners(): void {
        // Listen for minimize and close events from the header
        this.shadowRoot?.addEventListener('minimize', () => {
            this.fontSize -= 1;
            document.documentElement.style.setProperty(
                '--font-terminal-size',
                `${this.fontSize}px`
            );
        });

        this.shadowRoot?.addEventListener('maximize', () => {
            console.log('Maximize event received');
            this.fontSize += 1;
            document.documentElement.style.setProperty(
                '--font-terminal-size',
                `${this.fontSize}px`
            );
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

        // listen to custom output-progress event and scroll
        this.shadowRoot?.addEventListener('output-progress', () => {
            this.scrollToBottom()
        })
    }

    private commandHandler(command: string): void {
        const parsedCommand =
            this.parseCommand(command);
    
        const result =
            this.executeCommand(parsedCommand);
    
        if (result.type === 'output') {
            this.addTerminalEntry(
                parsedCommand,
                result.output || ''
            );
        }
    
        if (result.type === 'effect') {
            this.handleEffect(result.effect)
        }
    
        this.scrollToBottom();
    }

    private parseCommand(command: string): ParsedCommand {
        const [name, ...args] = command.split(' ');
        return { name, args };
    }

    private executeCommand(parsedCommand: ParsedCommand): CommandResult {
        const commandDef =
        CommandRegistry[parsedCommand.name]
        || CommandRegistry['default'];
    
        return commandDef.execute(
            parsedCommand.args,
            CommandRegistry
        );
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

        this.appendTerminalEntry(input, output);
    }

    private scrollToBottom(): void {
        const content = this.contentElement;
        if (!content) return;
        content.scrollTop = content.scrollHeight;
    }

    private appendTerminalEntry(input: string, output: string) {
        const content = this.contentElement;
        if(!content) return;

        const entry = document.createElement('terminal-entry');

        entry.setAttribute('input', input);
        entry.setAttribute('output', output);

        content.appendChild(entry);
    }

    private handleEffect(effect: CommandResult['effect']): void {
        if(!effect) return;

        switch(effect) {
            case 'clear':
                this.history = []

                const content = this.contentElement;
        
                if (content) {
                    content.innerHTML = '';
                }

                break;
            default:
                console.log('No effect') 
                break;
        }
    }
}

customElements.define('terminal-window', TerminalWindow);     
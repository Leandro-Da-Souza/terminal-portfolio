import type { TerminalEntry } from '../types/terminal';
import type { CommandResult, ParsedCommand } from '../types/command';
import { CommandRegistry, BootRegistry } from '../commands/registry';
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
        this.runBootSequence()
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
                    position: relative;
    
                    background:
                        radial-gradient(
                            circle at top,
                            rgba(200, 155, 60, 0.05),
                            transparent 40%
                        ),
    
                        linear-gradient(
                            to bottom,
                            rgba(255,255,255,0.015),
                            transparent 20%
                        ),
    
                        linear-gradient(
                            to right,
                            rgba(200,155,60,0.02),
                            transparent 35%
                        ),
    
                        var(--terminal-bg);
    
                    box-shadow:
                        inset 0 1px 0 rgba(255,255,255,0.03),
                        inset 0 -1px 0 rgba(0,0,0,0.35);
    
                    color: var(--terminal-text);
    
                    font-family: var(--font-terminal);
    
                    width: 100%;
                    height: 100vh;
    
                    padding: var(--space-lg);
    
                    overflow: hidden;
                }
    
                section.terminal-window::before {
                    content: '';
    
                    position: absolute;
                    inset: 0;
    
                    pointer-events: none;
    
                    background-image:
                        repeating-linear-gradient(
                            to bottom,
                            transparent 0px,
                            transparent 2px,
                            rgba(255,255,255,0.03) 3px
                        );
    
                    mix-blend-mode: soft-light;
                }
    
                main {
                    display: flex;
                    flex-direction: column;
    
                    height: 100%;
    
                    background-color: var(--terminal-panel);
    
                    border:
                        1px solid
                        var(--terminal-border);
    
                    box-shadow:
                        0 0 20px var(--terminal-shadow),
                        inset 0 0 24px rgba(0, 0, 0, 0.25);
    
                    padding: var(--space-md);
    
                    overflow: hidden;
                }
    
                section.terminal-content {
                    flex: 1;
    
                    display: flex;
                    flex-direction: column;
    
                    justify-content: flex-start;
    
                    overflow-y: auto;
    
                    padding-right: var(--space-xs);
                    padding-bottom: var(--space-xl);
                }
    
                section.terminal-content::-webkit-scrollbar {
                    width: 8px;
                }
    
                section.terminal-content::-webkit-scrollbar-thumb {
                    background-color: var(--terminal-border);
                }
    
                span.tooltip {
                    margin-top: auto;
    
                    padding-top: var(--space-lg);
    
                    font-size: 0.75rem;
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
                    <span class="tooltip">Type 'help' to see available commands.</span>
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

    private appendTerminalEntry(
        input: string, 
        output: string, 
        variant?: 'command' | 'system') 
    {
        const content = this.contentElement;
        if(!content) return;

        const entry = document.createElement('terminal-entry');

        entry.setAttribute('input', input);
        entry.setAttribute('output', output);
        
        if(variant) {
            entry.setAttribute('variant', variant)
        } 

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

    private runBootSequence(): void {
        Object.entries(BootRegistry)
            .forEach(([key, command], index) => {
                setTimeout(() => {
    
                    const result = command.execute();
                    console.log(result)
    
                    if (
                        result.type === 'output'
                        && result.output
                    ) {
    
                        this.appendTerminalEntry(
                            key,
                            result.output,
                            result.variant
                        );
    
                    }
    
                }, index * 1200);
            });
    }
}

customElements.define('terminal-window', TerminalWindow);     
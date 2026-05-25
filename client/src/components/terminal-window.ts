import type { TerminalEntry } from '../../../shared/types/terminal';
import type { CommandResult, CommandVariant, ParsedCommand } from '../../../shared/types/command';
import { CommandMetaData } from '../../../shared/metadata/command-metadata';
import { BootRegistry, ClientCommandRegistry } from '../commands/client-registry';
import { baseStyles } from '../styles/base';

class TerminalWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    private fontSize: number = 13;

    private contentElement: HTMLElement | null = null;

    private terminalElement: HTMLElement | null = null;

    private terminalInput: HTMLElement | null = null;

    private rebootButton: HTMLElement | null = null;

    private history: TerminalEntry[] = [];

    private isBooting: boolean = false;

    private isOpen: boolean = true;

    connectedCallback() {
        this.render();

        this.contentElement = this.shadowRoot!.querySelector(
            '.terminal-content'
        ) as HTMLElement | null;
        this.terminalElement = this.shadowRoot!.querySelector(
            'section.terminal-window'
        ) as HTMLElement | null;
        this.terminalInput = this.shadowRoot!.querySelector('terminal-input') as HTMLElement | null;
        this.rebootButton = this.shadowRoot!.querySelector('.reboot-button') as HTMLElement | null;

        this.attachEventListeners();
        this.runBootSequence();
        this.animationStart();
        this.animationEnd();
    }

    disconnectedCallback(): void {
        window.removeEventListener('keydown', this.handleKeydown);

        this.terminalElement?.removeEventListener('animationend', this.handleAnimationEnd);
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
                            var(--terminal-overlay-strong),
                            transparent 40%
                        ),
    
                        linear-gradient(
                            to bottom,
                            var(--terminal-overlay-soft),
                            transparent 20%
                        ),
    
                        linear-gradient(
                            to right,
                            var(--terminal-scanline),
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

                    transform-origin: center center;
                    will-change: transform, opacity, filter;
                    
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
                            rgba(255,255,255,0.08) 3.5px
                        );
                
                    mix-blend-mode: soft-light;
                
                    animation:
                        scanlines 14s linear infinite;
                }

                section.terminal-window::after {
                    content: '';
                    position: absolute;
                    inset: 0;

                    pointer-events: none;

                    background:
                        linear-gradient(
                            to bottom,
                            transparent 0%,
                            transparent 47%,
                            rgba(255,255,255,0.95) 49%,
                            rgba(255,255,255,1) 50%,
                            rgba(255,255,255,0.95) 51%,
                            transparent 53%,
                            transparent 100%
                        );

                    opacity: 0;

                    mix-blend-mode: screen;
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

                    transition:
                        opacity 120ms ease;
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
                    margin-bottom: 0.5rem;
    
                    font-size: 0.80rem;
                }

                .terminal-window.closing {
                    animation:
                        crtShutdown 0.45s ease-out;
                }

                .terminal-window.closing::after {
                    animation:
                        crtFlash 180ms ease-out;
                }

                .terminal-window.closed main {
                    opacity: 0;
                    pointer-events: none;
                }

                .terminal-window.opening {
                    animation:
                        crtBootup 0.45s ease-out;
                }

                section.terminal-overlay {
                    position: absolute;
                    inset: 0;
                
                    display: none;
                
                    align-items: center;
                    justify-content: center;
                
                    background:
                        rgba(0,0,0,0.92);
                
                    z-index: 20;
                    opacity: 0;

                    transition:
                        opacity 180ms ease;
                
                    pointer-events: none;
                    
                }

                .terminal-window.closed .terminal-overlay {
                    display: flex;
                    opacity: 1;
                    pointer-events: all;
                }

                .reboot-button {
                    background: transparent;
                
                    border:
                        1px solid var(--terminal-border);
                
                    color: var(--terminal-accent);
                
                    padding:
                        var(--space-md)
                        var(--space-lg);
                
                    font-family: var(--font-terminal);
                
                    cursor: pointer;
                
                    text-transform: uppercase;
                
                    letter-spacing: 0.08em;

                    animation:
                        rebootPulse 2s ease-in-out infinite;
                }

                ${this.keyFrameAnimations()}
            </style>
        `;
    }

    protected markup(): string {
        return `
            <section class="terminal-window">
                <section class="terminal-overlay">
                    <button class="reboot-button">
                        [ TERMINAL OFFLINE ]
                         <br>
                        TAP TO REBOOT
                    </button>
                </section>
                <main>
                    <terminal-header></terminal-header>
                    <terminal-banner></terminal-banner>
                    <section class="terminal-content">
                    </section>
                    <span class="tooltip">Type 'help' to see available commands.</span>
                    <terminal-input
                        ${this.isBooting ? 'disabled' : ''}
                    ></terminal-input>
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
            this.shutdownTerminal();
        });

        // Listen for command events from the input
        this.shadowRoot?.addEventListener('command', (event: Event) => {
            const customEvent = event as CustomEvent;
            const command = customEvent.detail;
            this.commandHandler(command);
        });

        // listen to custom output-progress event and scroll
        this.shadowRoot?.addEventListener('output-progress', () => {
            this.scrollToBottom();
        });

        this.rebootButton?.addEventListener('click', () => this.rebootTerminal());
    }

    private async commandHandler(command: string): Promise<void> {
        const parsedCommand = this.parseCommand(command);

        if (this.isServerCommand(parsedCommand.name)) {
            await this.sendCommandToServer(parsedCommand);

            return;
        }

        const result = this.executeCommand(parsedCommand);

        this.handleCommandResult(parsedCommand, result);

        this.scrollToBottom();
    }

    private parseCommand(command: string): ParsedCommand {
        const [name = '', ...args] = command.trim().split(/\s+/);

        return { name, args };
    }

    private executeCommand(parsedCommand: ParsedCommand): CommandResult {
        const commandDef =
            ClientCommandRegistry[parsedCommand.name] || ClientCommandRegistry['default'];

        return commandDef.execute(parsedCommand.args, CommandMetaData);
    }

    private handleCommandResult(parsedCommand: ParsedCommand, result: CommandResult): void {
        if (result.output) {
            this.addTerminalEntry(parsedCommand, result.output, result.variant);
        }

        if (result.type === 'effect') {
            this.handleEffect(result.effect, result.parameter);
        }
    }

    private addTerminalEntry(
        parsedCommand: ParsedCommand,
        output: string,
        variant?: CommandVariant
    ): void {
        const input = [parsedCommand.name, ...parsedCommand.args].join(' ');

        this.history.push({
            input,
            output,
        });

        this.appendTerminalEntry(input, output, variant);
    }

    private scrollToBottom(): void {
        const content = this.contentElement;
        if (!content) return;
        content.scrollTop = content.scrollHeight;
    }

    private appendTerminalEntry(input: string, output: string, variant?: CommandVariant): void {
        const content = this.contentElement;
        if (!content) return;

        const entry = document.createElement('terminal-entry');

        entry.setAttribute('input', input);
        entry.setAttribute('output', output);

        if (variant) {
            entry.setAttribute('variant', variant);
        }

        content.appendChild(entry);
    }

    private handleEffect(
        effect: CommandResult['effect'],
        parameter?: CommandResult['parameter']
    ): void {
        if (!effect) return;

        switch (effect) {
            case 'clear':
                this.history = [];

                const content = this.contentElement;

                if (content) {
                    content.innerHTML = '';
                }

                break;
            case 'theme-change':
                if (!parameter) return;

                document.documentElement.setAttribute('data-theme', parameter);

                localStorage.setItem('theme', parameter);

                break;
            case 'shutdown':
                this.shutdownTerminal();
                break;
            default:
                console.log('No effect found for: ', effect);
                break;
        }
    }

    private isServerCommand(commandName: string): boolean {
        const command = CommandMetaData[commandName];

        return command?.scope === 'server';
    }

    private async sendCommandToServer(parsedCommand: ParsedCommand): Promise<void> {
        try {
            const response = await fetch('http://localhost:3001/terminal/command', {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json',
                },

                body: JSON.stringify({
                    command: [parsedCommand.name, ...parsedCommand.args].join(' '),
                }),
            });

            const result = (await response.json()) as CommandResult;

            this.handleCommandResult(parsedCommand, result);
        } catch {
            this.addTerminalEntry(parsedCommand, 'Unable to reach terminal server.', 'system');
        } finally {
            this.scrollToBottom();
        }
    }

    private runBootSequence(): void {
        this.isBooting = true;

        this.terminalInput?.setAttribute('disabled', 'true');

        Object.entries(BootRegistry).forEach(([key, command], index, array) => {
            setTimeout(() => {
                const result = command.execute();
                console.log(result);

                if (result.type === 'output' && result.output) {
                    this.appendTerminalEntry(key, result.output, result.variant);
                }

                // last boot item
                if (index === array.length - 1) {
                    this.isBooting = false;

                    this.terminalInput?.removeAttribute('disabled');
                }
            }, index * 1200);
        });
    }

    private keyFrameAnimations(): string {
        return `
            @keyframes scanlines {
                from {
                    transform: translateY(0);
                }
            
                to {
                    transform: translateY(14px);
                }
            }

            @keyframes crtShutdown {
                0% {
                    opacity: 1;
                    transform: scaleY(1);
                    filter: brightness(1);
                }
            
                70% {
                    transform: scaleY(0.02);
                    filter:
                        brightness(8)
                        blur(1px);
                }
            
                100% {
                    transform: scaleY(0);
                    opacity: 0;
                }
            }

            @keyframes crtBootup {
                0% {
                    opacity: 0;
                    transform: scaleY(0);
                    filter: brightness(3);
                }
            
                20% {
                    opacity: 1;
                    transform: scaleY(0.02);
                    filter:
                        brightness(8)
                        blur(1px);
                }
            
                60% {
                    transform: scaleY(1.05);
                    filter: brightness(1.5);
                }
            
                100% {
                    opacity: 1;
                    transform: scaleY(1);
                    filter: brightness(1);
                }
            }

            @keyframes crtFlash {

                0% {
                    opacity: 0;
                    transform: scaleY(1);
                }
            
                25% {
                    opacity: 0.85;
                    transform: scaleY(1.4);
                }
            
                100% {
                    opacity: 0;
                    transform: scaleY(0.02);
                }
            }
            @keyframes rebootPulse {

                0%, 100% {
                    opacity: 0.7;
                }
            
                50% {
                    opacity: 1;
                }
            }
        `;
    }

    private handleAnimationEnd = (): void => {
        if (this.terminalElement?.classList.contains('closing')) {
            this.terminalElement.classList.remove('closing');

            this.terminalElement.classList.add('closed');

            this.isOpen = false;
        }

        if (this.terminalElement?.classList.contains('opening')) {
            this.terminalElement.classList.remove('opening');
        }
    };

    private rebootTerminal(): void {
        if (this.isOpen) return;

        this.terminalElement?.classList.remove('closed', 'closing');

        this.terminalElement?.classList.add('opening');

        this.isOpen = true;
    }

    private handleKeydown = (): void => {
        this.rebootTerminal();
    };

    private animationStart(): void {
        window.addEventListener('keydown', this.handleKeydown);
    }

    private animationEnd(): void {
        this.terminalElement?.addEventListener('animationend', this.handleAnimationEnd);
    }

    private shutdownTerminal(): void {
        if (!this.isOpen) return;

        this.terminalElement?.classList.remove('opening', 'closed');

        this.terminalElement?.classList.add('closing');
    }
}

customElements.define('terminal-window', TerminalWindow);

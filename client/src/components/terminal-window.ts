import type { TerminalEntry } from '../../../shared/types/terminal';
import type {
    CommandEffect,
    CommandResult,
    CommandVariant,
    ParsedCommand,
} from '../../../shared/types/command';
import { CommandMetaData } from '../../../shared/metadata/command-metadata';
import { ClientCommandRegistry } from '../commands/client-registry';
import { BootSequence, SystemMessages, ServerErrorMessage } from '../commands/system-registry';
import { TerminalInput } from './terminal-input';
import baseText from '../styles/components/base.css?inline';
import cssText from '../styles/components/terminal-window.css?inline';

const terminalWindowStyleSheet = new CSSStyleSheet();
terminalWindowStyleSheet.replaceSync(cssText);

const baseStyleSheet = new CSSStyleSheet();
baseStyleSheet.replaceSync(baseText);

class TerminalWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open',
        }).adoptedStyleSheets = [baseStyleSheet, terminalWindowStyleSheet];
    }

    static define(tag = 'terminal-window'): void {
        if (!customElements.get(tag)) {
            customElements.define(tag, this);
        }
    }

    private fontSize: number = 13;

    private contentElement: HTMLElement | null = null;

    private terminalElement: HTMLElement | null = null;

    private terminalInput: TerminalInput | null = null;

    private rebootButton: HTMLElement | null = null;

    private history: TerminalEntry[] = [];

    private isBooting: boolean = false;

    private isLoading: boolean = false;

    private isOpen: boolean = true;

    connectedCallback() {
        this.render();

        this.contentElement = this.shadowRoot!.querySelector(
            '.terminal-content'
        ) as HTMLElement | null;
        this.terminalElement = this.shadowRoot!.querySelector(
            'section.terminal-window'
        ) as HTMLElement | null;
        this.terminalInput = this.shadowRoot!.querySelector(
            'terminal-input'
        ) as TerminalInput | null;
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
            ${this.markup()}
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

        this.shadowRoot?.addEventListener('command', (event: Event) => {
            const customEvent = event as CustomEvent;
            const command = customEvent.detail;
            this.commandHandler(command);
        });

        this.shadowRoot?.addEventListener('output-progress', () => {
            this.scrollToBottom();
        });

        this.rebootButton?.addEventListener('click', () => this.rebootTerminal());
    }

    private async commandHandler(command: string): Promise<void> {
        const parsedCommand = this.parseCommand(command);

        const result = await this.executeCommand(parsedCommand);

        this.handleCommandResult(parsedCommand, result);

        this.scrollToBottom();
    }

    private parseCommand(command: string): ParsedCommand {
        const [name = '', ...args] = command.trim().split(/\s+/);

        return { name, args };
    }

    private async executeCommand(parsedCommand: ParsedCommand): Promise<CommandResult> {
        const metadata = CommandMetaData[parsedCommand.name];

        if (!metadata) {
            return ClientCommandRegistry['default'].execute();
        }

        switch (metadata.transport) {
            case 'local': {
                return this.executeLocalCommand(parsedCommand);
            }

            case 'request': {
                this.setLoading(true);

                try {
                    return await this.executeServerCommand(parsedCommand);
                } finally {
                    this.setLoading(false);
                }
            }

            case 'stream':
                return this.executeStreamCommand();
        }
    }

    private handleCommandResult(parsedCommand: ParsedCommand, result: CommandResult): void {
        switch (result.type) {
            case 'output':
                this.addTerminalEntry(parsedCommand, result.output, result.variant);
                break;

            case 'effect':
                if (result.output) {
                    this.addTerminalEntry(parsedCommand, result.output);
                }

                this.handleEffect(result.effect, result.parameter);
                break;
            case 'stream':
                this.addTerminalEntry(parsedCommand, '');
                this.handleStream(result.endpoint);
                break;
            default:
                break;
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

    private handleEffect(effect: CommandEffect, parameter?: string): void {
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

    private async executeServerCommand(parsedCommand: ParsedCommand): Promise<CommandResult> {
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

            return (await response.json()) as CommandResult;
        } catch {
            this.addSystemMessage(SystemMessages.relayFailed);

            return ServerErrorMessage;
        }
    }

    private executeLocalCommand(parsedCommand: ParsedCommand): CommandResult {
        const commandDef =
            ClientCommandRegistry[parsedCommand.name] || ClientCommandRegistry['default'];

        return commandDef.execute(parsedCommand.args, CommandMetaData);
    }

    private handleStream(endpoint: string): void {
        const source = new EventSource(endpoint);

        source.onmessage = (event) => {
            this.addSystemMessage(event.data);

            if (event.data === 'COMPLETE...') {
                source.close();
            }
        };

        source.onerror = () => {
            source.close();

            this.addSystemMessage(SystemMessages.relayFailed);
        };
    }

    private executeStreamCommand(): CommandResult {
        return {
            type: 'stream',
            endpoint: 'http://localhost:3001/terminal/stream',
        };
    }

    private runBootSequence(): void {
        this.isBooting = true;

        this.terminalInput?.setAttribute('disabled', 'true');

        BootSequence.forEach((message, index, array) => {
            setTimeout(() => {
                this.addSystemMessage(message);

                if (index === array.length - 1) {
                    this.isBooting = false;

                    this.terminalInput?.removeAttribute('disabled');
                }
            }, index * 1200);
        });
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

    private addSystemMessage(message: string): void {
        if (message.trim() === '') return;

        this.addTerminalEntry(
            {
                name: '',
                args: [],
            },
            message,
            'system'
        );
    }

    private shutdownTerminal(): void {
        if (!this.isOpen) return;

        this.terminalElement?.classList.remove('opening', 'closed');

        this.terminalElement?.classList.add('closing');
    }

    private setLoading(loading: boolean): void {
        if (this.isLoading === loading) return;

        if (loading) {
            this.addSystemMessage(SystemMessages.relayConnecting);
        }

        this.isLoading = loading;
        this.terminalInput?.setDisabled(loading);
    }
}

TerminalWindow.define();

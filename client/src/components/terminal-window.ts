import type { TerminalEntry } from '../../../shared/types/terminal';
import type {
    CommandEffect,
    CommandMode,
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
import { isTheme, type Theme } from '../../../shared/types/theme.js';

const terminalWindowStyleSheet = new CSSStyleSheet();
terminalWindowStyleSheet.replaceSync(cssText);

const baseStyleSheet = new CSSStyleSheet();
baseStyleSheet.replaceSync(baseText);

type LiveTerminalEntry = HTMLElement & {
    setLiveOutput(output: string, complete?: boolean): void;
};

type TerminalHeaderElement = HTMLElement & {
    mode: string | null;
};

const MachineSpiritBootSequence = [
    'COGITATOR LINK ESTABLISHED',
    'Accessing archive subsystems...',
    'Synchronizing repository records...',
    'Machine Spirit online.',
];

const StartupCommand = 'about';

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

    private contentElement: HTMLElement | null = null;

    private terminalElement: HTMLElement | null = null;

    private terminalInput: TerminalInput | null = null;

    private terminalHeader: TerminalHeaderElement | null = null;

    private tooltipElement: HTMLElement | null = null;

    private rebootButton: HTMLElement | null = null;

    private history: TerminalEntry[] = [];

    private isBooting: boolean = false;

    private isLoading: boolean = false;

    private isOpen: boolean = true;

    private renderQueue: Promise<void> = Promise.resolve();

    private renderQueueVersion: number = 0;

    private activeMode: CommandMode | null = null;

    private machineSpiritEndpoint: string | null = null;

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
        this.terminalHeader = this.shadowRoot!.querySelector(
            'terminal-header'
        ) as TerminalHeaderElement | null;
        this.tooltipElement = this.shadowRoot!.querySelector('.tooltip') as HTMLElement | null;
        this.rebootButton = this.shadowRoot!.querySelector('.reboot-button') as HTMLElement | null;

        this.setMachineSpiritMode(false);
        this.attachEventListeners();
        this.attachViewportListeners();
        this.updateKeyboardInset();
        this.runBootSequence();
        this.animationStart();
        this.animationEnd();
    }

    disconnectedCallback(): void {
        window.removeEventListener('keydown', this.handleKeydown);

        this.terminalElement?.removeEventListener('animationend', this.handleAnimationEnd);
        window.visualViewport?.removeEventListener('resize', this.handleViewportChange);
        window.visualViewport?.removeEventListener('scroll', this.handleViewportChange);
        window.removeEventListener('resize', this.handleViewportChange);
    }

    protected render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.markup()}
        `;
    }

    protected markup(): string {
        return `
            <section class="terminal-window opening">
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
        if (this.activeMode === 'machine-spirit' && command !== 'exit') {
            await this.handleMachineCommand(command);
            return;
        }

        if (this.activeMode === 'machine-spirit' && command === 'exit') {
            this.activeMode = null;
            this.machineSpiritEndpoint = null;
            this.setMachineSpiritMode(false);
            this.addSystemMessage('Machine spirit dormant.');
            return;
        }

        const parsedCommand = this.parseCommand(command);

        const result = await this.executeCommand(parsedCommand);

        this.handleCommandResult(parsedCommand, result);

        await this.focusInputAfterOutput(result);

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

            case 'mode': {
                return this.executeModeSwitch(parsedCommand);
            }
        }
    }

    private handleCommandResult(parsedCommand: ParsedCommand, result: CommandResult): void {
        switch (result.type) {
            case 'output': {
                this.addTerminalEntry(parsedCommand, result.output, result.variant);
                break;
            }
            case 'effect': {
                if (result.output) {
                    this.addTerminalEntry(parsedCommand, result.output);
                }

                this.handleEffect(result.effect, result.parameter);
                break;
            }
            case 'mode': {
                this.activeMode = result.mode;
                this.machineSpiritEndpoint = result.endpoint;
                this.setMachineSpiritMode(result.mode === 'machine-spirit');
                this.runMachineSpiritBootSequence();
                break;
            }

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
        const queueVersion = this.renderQueueVersion;

        this.renderQueue = this.renderQueue
            .then(() => this.renderQueuedTerminalEntry(input, output, variant, queueVersion))
            .catch((error: unknown) => {
                console.error('Failed to render terminal entry:', error);
            });
    }

    private renderQueuedTerminalEntry(
        input: string,
        output: string,
        variant: CommandVariant | undefined,
        queueVersion: number
    ): Promise<void> {
        const content = this.contentElement;
        if (!content || queueVersion !== this.renderQueueVersion) {
            return Promise.resolve();
        }

        const entry = document.createElement('terminal-entry');
        const resolvedVariant = variant || 'command';

        entry.setAttribute('input', input);
        entry.setAttribute('output', output);
        entry.setAttribute('animation-mode', resolvedVariant === 'system' ? 'word' : 'character');

        if (variant) {
            entry.setAttribute('variant', variant);
        }

        return new Promise((resolve) => {
            entry.addEventListener(
                'output-complete',
                () => {
                    resolve();
                },
                { once: true }
            );

            content.appendChild(entry);
        });
    }

    private appendLiveTerminalEntry(
        input: string,
        variant?: CommandVariant,
        animationMode: 'word' | 'character' = 'character'
    ): Promise<LiveTerminalEntry | null> {
        const queueVersion = this.renderQueueVersion;

        const entryPromise = this.renderQueue.then(() => {
            return this.renderQueuedLiveTerminalEntry(input, variant, animationMode, queueVersion);
        });

        this.renderQueue = entryPromise
            .then(() => undefined)
            .catch((error: unknown) => {
                console.error('Failed to render live terminal entry:', error);
            });

        return entryPromise.catch(() => null);
    }

    private renderQueuedLiveTerminalEntry(
        input: string,
        variant: CommandVariant | undefined,
        animationMode: 'word' | 'character',
        queueVersion: number
    ): LiveTerminalEntry | null {
        const content = this.contentElement;

        if (!content || queueVersion !== this.renderQueueVersion) {
            return null;
        }

        const entry = document.createElement('terminal-entry') as LiveTerminalEntry;

        entry.setAttribute('input', input);
        entry.setAttribute('output', '');
        entry.setAttribute('animation-mode', animationMode);

        if (variant) {
            entry.setAttribute('variant', variant);
        }

        content.appendChild(entry);

        return entry;
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

                this.renderQueueVersion += 1;
                this.renderQueue = Promise.resolve();

                break;
            case 'theme-change':
                if (!parameter) return;
                if (!isTheme(parameter)) return;

                this.updateTheme(parameter);

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
            const response = await fetch('/terminal/command', {
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

    private async executeLocalCommand(parsedCommand: ParsedCommand): Promise<CommandResult> {
        const commandDef =
            ClientCommandRegistry[parsedCommand.name] || ClientCommandRegistry['default'];

        return await commandDef.execute(parsedCommand.args, CommandMetaData);
    }

    private async executeModeSwitch(command: ParsedCommand): Promise<CommandResult> {
        return await this.executeServerCommand(command);
    }

    private async handleMachineCommand(input: string): Promise<void> {
        this.scrollToBottom();

        const endpoint = this.machineSpiritEndpoint;

        if (!endpoint) {
            this.addSystemMessage(SystemMessages.relayFailed);
            return;
        }

        const entry = await this.appendLiveTerminalEntry(input, undefined, 'word');

        if (!entry) {
            this.addSystemMessage(SystemMessages.relayFailed);
            return;
        }

        this.scrollToBottom();

        this.setLoading(true, false);

        try {
            const response = await fetch(`${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: input,
                }),
            });

            if (!response.ok || !response.body) {
                entry.setLiveOutput(SystemMessages.relayFailed, true);
                return;
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let output = '';
            let isDone = false;

            while (!isDone) {
                const { done, value } = await reader.read();
                isDone = done;

                if (value) {
                    output += decoder.decode(value, { stream: !done });
                    entry.setLiveOutput(output);
                }
            }

            output += decoder.decode();
            const finalOutput = output || SystemMessages.relayFailed;

            entry.setLiveOutput(finalOutput, true);

            this.history.push({
                input,
                output: finalOutput,
            });
        } catch {
            entry.setLiveOutput(SystemMessages.relayFailed, true);
        } finally {
            this.setLoading(false);
            this.scrollToBottom();
            this.focusInputIfAllowed();
        }
    }

    private runBootSequence(): void {
        this.isBooting = true;

        this.terminalInput?.setAttribute('disabled', 'true');

        BootSequence.forEach((message, index, array) => {
            setTimeout(() => {
                this.addSystemMessage(message);

                if (index === array.length - 1) {
                    void this.runStartupCommand();
                }
            }, index * 1200);
        });
    }

    private async runStartupCommand(): Promise<void> {
        await this.renderQueue;
        await this.commandHandler(StartupCommand);

        this.isBooting = false;
        this.terminalInput?.removeAttribute('disabled');
        this.focusInputIfAllowed();
    }

    private runMachineSpiritBootSequence(): void {
        MachineSpiritBootSequence.forEach((message) => {
            this.addSystemMessage(message);
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

    private attachViewportListeners(): void {
        window.visualViewport?.addEventListener('resize', this.handleViewportChange);
        window.visualViewport?.addEventListener('scroll', this.handleViewportChange);
        window.addEventListener('resize', this.handleViewportChange);
    }

    private handleViewportChange = (): void => {
        this.updateKeyboardInset();
        this.scrollToBottom();
    };

    private updateKeyboardInset(): void {
        const visualViewport = window.visualViewport;

        if (!visualViewport) {
            this.terminalElement?.style.setProperty('--keyboard-inset', '0px');
            this.terminalElement?.style.setProperty('--viewport-height', '100dvh');
            return;
        }

        const inset = Math.max(
            0,
            window.innerHeight - visualViewport.height - visualViewport.offsetTop
        );

        this.terminalElement?.style.setProperty('--keyboard-inset', `${inset}px`);
        this.terminalElement?.style.setProperty('--viewport-height', `${visualViewport.height}px`);
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

    private setMachineSpiritMode(active: boolean): void {
        if (active) {
            this.terminalElement?.setAttribute('data-mode', 'machine-spirit');
            this.terminalHeader?.setAttribute('mode', 'machine-spirit');
            this.setTooltipText("Type 'exit' to leave Machine Spirit mode.");
            return;
        }

        this.terminalElement?.removeAttribute('data-mode');
        this.terminalHeader?.removeAttribute('mode');
        this.setTooltipText("Type 'help' to see available commands.");
    }

    private setTooltipText(text: string): void {
        if (!this.tooltipElement) return;

        this.tooltipElement.textContent = text;
    }

    private shutdownTerminal(): void {
        if (!this.isOpen) return;

        this.terminalElement?.classList.remove('opening', 'closed');

        this.terminalElement?.classList.add('closing');
    }

    private setLoading(loading: boolean, announce = true): void {
        if (this.isLoading === loading) return;

        if (loading && announce) {
            this.addSystemMessage(SystemMessages.relayConnecting);
        }

        this.isLoading = loading;
        this.terminalInput?.setDisabled(loading || this.isBooting);
    }

    private async focusInputAfterOutput(result: CommandResult): Promise<void> {
        if (result.type === 'effect' && result.effect === 'shutdown') return;

        await this.renderQueue;
        this.focusInputIfAllowed();
    }

    private focusInputIfAllowed(): void {
        if (this.isMobileViewport()) return;

        this.terminalInput?.focusCommandInput();
    }

    private isMobileViewport(): boolean {
        return window.matchMedia('(max-width: 768px), (hover: none) and (pointer: coarse)').matches;
    }

    private updateTheme(theme: Theme) {
        document.documentElement.setAttribute('data-theme', theme);

        localStorage.setItem('theme', theme);

        const favicon = document.querySelector("link[rel='icon']") as HTMLLinkElement;

        if (!favicon) return;

        favicon.href = `/${theme}.ico`;
    }

}

TerminalWindow.define();

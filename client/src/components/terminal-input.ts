import { CommandMetaData } from '../../../shared/metadata/command-metadata';
import baseText from '../styles/components/base.css?inline';
import cssText from '../styles/components/terminal-input.css?inline';

const terminalInputStyleSheet = new CSSStyleSheet();
terminalInputStyleSheet.replaceSync(cssText);

const baseStyleSheet = new CSSStyleSheet();
baseStyleSheet.replaceSync(baseText);

export class TerminalInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open'
        }).adoptedStyleSheets = [
            baseStyleSheet,
            terminalInputStyleSheet
        ];
    }

    static define(tag = 'terminal-input'): void {
        if (!customElements.get(tag)) {
            customElements.define(tag, this);
        }
    }

    static get observedAttributes() {
        return ['disabled'];
    }

    private commands: string[] = [];

    private commandHistory: string[] = [];

    private historyIndex: number = -1;

    connectedCallback() {
        this.render();
        this.attachEventHandlers();
        this.focusInput();
        this.commands = this.getCommands();
    }

    attributeChangedCallback() {
        this.render();
        this.attachEventHandlers();
        this.focusInput();
    }

    public get disabled(): boolean {
        return this.hasAttribute('disabled');
    }

    public setDisabled(disabled: boolean): void {
        if (disabled) {
            this.setAttribute('disabled', '');
        } else {
            this.removeAttribute('disabled');
        }
    }

    protected render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.markup()}
        `;
    }

    protected markup(): string {
        return `
            <div class="command-wrapper">
                <input 
                    type="text" 
                    class="command-input" 
                    placeholder="Enter command..."
                    ${this.disabled ? 'disabled' : ''} 
                    autofocus 
                />
            </div>
        `;
    }

    protected attachEventHandlers(): void {
        this.commandHandler();
    }

    private commandHandler(): void {
        const commandInput = this.shadowRoot?.querySelector(
            '.command-input'
        ) as HTMLInputElement | null;
        if (!commandInput) return;

        commandInput.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'Enter':
                    event.preventDefault();
                    const command = commandInput.value.trim().toLocaleLowerCase();
                    if (command) {
                        this.dispatchCommand(command);
                        this.pushToCommandHistory(command);
                    }
                    commandInput.value = '';
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    this.cycleHistory('up');
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    this.cycleHistory('down');
                    break;
                case 'Tab':
                    event.preventDefault();
                    this.autoCompleteCommand();
                    break;
                default:
                    break;
            }
        });
    }

    autoCompleteCommand() {
        const input = this.shadowRoot?.querySelector('.command-input') as HTMLInputElement | null;

        if (!input) return;

        if (this.commands.length === 0) return;

        const currentValue = input.value.trim();

        const match = this.commands.find((command) => command.startsWith(currentValue));

        if (match) {
            input.value = match;
        }
    }

    private getCommands(): string[] {
        return Object.keys(CommandMetaData);
    }

    private dispatchCommand(command: string): void {
        this.dispatchEvent(
            new CustomEvent('command', { detail: command, bubbles: true, composed: true })
        );
    }

    private focusInput(): void {
        const input = this.shadowRoot?.querySelector('.command-input') as HTMLInputElement | null;

        input?.focus();
    }

    private pushToCommandHistory(command: string) {
        this.commandHistory.push(command);
        this.historyIndex = this.commandHistory.length;
    }

    private cycleHistory(direction: 'up' | 'down') {
        if (this.commandHistory.length === 0) {
            return;
        }

        const input = this.shadowRoot?.querySelector('.command-input') as HTMLInputElement | null;

        if (!input) return;

        if (direction === 'up') {
            if (this.historyIndex > 0) {
                this.historyIndex--;
            }
        } else {
            if (this.historyIndex < this.commandHistory.length) {
                this.historyIndex++;
            }
        }

        if (this.historyIndex === this.commandHistory.length) {
            input.value = '';

            return;
        }

        input.value = this.commandHistory[this.historyIndex] || '';
    }
}

TerminalInput.define();

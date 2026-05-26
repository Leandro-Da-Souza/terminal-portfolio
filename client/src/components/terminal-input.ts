import { baseStyles } from '../styles/base';
import { CommandMetaData } from '../../../shared/metadata/command-metadata';

export class TerminalInput extends HTMLElement {
    static get observedAttributes() {
        return ['disabled'];
    }

    private commands: string[] = [];

    private commandHistory: string[] = [];

    private historyIndex: number = -1;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

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
            ${this.styles()}
            ${this.markup()}
        `;
    }

    protected styles(): string {
        return `
            <style>
                ${baseStyles}
    
                .command-wrapper {
                    display: flex;
                    align-items: center;
    
                    gap: var(--space-sm);
    
                    padding:
                        var(--space-sm)
                        var(--space-md);
    
                    background-color: var(--terminal-surface);
    
                    border:
                        1px solid
                        var(--terminal-border);
    
                    box-shadow:
                        inset 0 0 12px var(--terminal-depth-shadow);
    
                    position: relative;
                }
    
                .command-wrapper::before {
                    content: '>';
    
                    color: var(--terminal-accent);
    
                    font-weight: 700;
    
                    text-shadow:
                        0 0 8px var(--terminal-glow);
                }
    
                .command-input {
                    flex: 1;
    
                    width: 100%;
    
                    background-color: transparent;
                    border: none;
    
                    color: var(--terminal-text);
    
                    font-family: var(--font-terminal);
                    font-size: var(--font-terminal-size);
    
                    caret-color: var(--terminal-accent);
    
                    text-shadow:
                        0 0 4px var(--terminal-glow);
                }
    
                .command-input:focus {
                    outline: none;
                }
    
                .command-input::placeholder {
                    color: var(--terminal-text-muted);
    
                    opacity: 0.65;
                }
    
                .command-input::selection {
                    background-color: var(--terminal-selection);
    
                    color:
                        var(--terminal-text-bright);
                }

                .command-input:disabled {
                    opacity: 0.25;
                    cursor: not-allowed;
                }
            </style>
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

customElements.define('terminal-input', TerminalInput);

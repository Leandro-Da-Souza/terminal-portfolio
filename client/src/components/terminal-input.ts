import { baseStyles } from "../styles/base";

class TerminalInput extends HTMLElement {
    static get observedAttributes() {
        return ['disabled'];
    }

    private commandHistory: string[] = []

    private historyIndex: number = -1;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.attachEventHandlers();
        this.focusInput()
    }
    
    attributeChangedCallback() {
        this.render();
        this.attachEventHandlers();
        this.focusInput()
    }

    public get disabled(): boolean {
        return this.hasAttribute('disabled');
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
                        inset 0 0 12px rgba(0,0,0,0.25);
    
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
                        0 0 4px rgba(126, 231, 135, 0.2);
                }
    
                .command-input:focus {
                    outline: none;
                }
    
                .command-input::placeholder {
                    color: var(--terminal-text-muted);
    
                    opacity: 0.65;
                }
    
                .command-input::selection {
                    background-color:
                        rgba(200, 155, 60, 0.35);
    
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
        const commandInput = this.shadowRoot?.querySelector('.command-input') as HTMLInputElement | null;
        if (!commandInput) return;

        commandInput.addEventListener('keydown', (event) => {

            switch(event.key) {
                case 'Enter':
                    const command = commandInput.value.trim().toLocaleLowerCase();
                    if (command) {
                        this.dispatchCommand(command);
                        this.pushToCommandHistory(command)
                    }
                    commandInput.value = '';
                    break;
                case 'ArrowUp':
                    this.cycleHistory('up')
                    break;
                case 'ArrowDown':
                    this.cycleHistory('down')
                    break;
                default:
                    break;
            }

        });
    }

    private dispatchCommand(command: string): void {
        this.dispatchEvent(new CustomEvent('command', { detail: command, bubbles: true, composed: true }));
    }

    private focusInput(): void {
        const input = this.shadowRoot?.querySelector('.command-input') as HTMLInputElement | null;

        input?.focus();
    }

    private pushToCommandHistory(command:string) {
        this.commandHistory.push(command)
        this.historyIndex = this.commandHistory.length;
    }

    private cycleHistory(
        direction: 'up' | 'down'
    ) {

        if (this.commandHistory.length === 0) {
            return;
        }
    
        const input =
            this.shadowRoot?.querySelector('.command-input') as HTMLInputElement | null;
    
        if (!input) return;
    
        if (direction === 'up') {
    
            if (this.historyIndex > 0) {
                this.historyIndex--;
            }
    
        } else {
    
            if (
                this.historyIndex
                < this.commandHistory.length
            ) {
                this.historyIndex++;
            }
    
        }
    
        if (
            this.historyIndex
            === this.commandHistory.length
        ) {
    
            input.value = '';
    
            return;
        }
    
        input.value =
            this.commandHistory[this.historyIndex] || '';
    }

}

customElements.define('terminal-input', TerminalInput);

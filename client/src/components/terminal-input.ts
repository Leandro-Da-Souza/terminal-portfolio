import { baseStyles } from "../styles/base";

class TerminalInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.attachEventHandlers();
        this.focusInput()
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

                .command-input {
                    width: 100%;
    
                    background-color: transparent;
                    border: none;
    
                    color: var(--terminal-text);
    
                    font-family: var(--font-terminal);
                    font-size: 0.875rem;
    
                    caret-color: var(--terminal-text);
    
                    padding:
                        var(--space-xs)
                        0;
                }
    
                .command-input:focus {
                    outline: none;
                }
    
                .command-input::placeholder {
                    color: var(--terminal-text-muted);
                }
            </style>
        `;
    }

    protected markup(): string {
        return `
            <input type="text" class="command-input" placeholder="Enter command..." autofocus />
        `;
    }

    protected attachEventHandlers(): void {
        this.commandHandler();
    }


    private commandHandler(): void {
        const commandInput = this.shadowRoot?.querySelector('.command-input') as HTMLInputElement | null;
        if (!commandInput) return;

        commandInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const command = commandInput.value.trim();
                if (command) {
                    this.dispatchCommand(command);
                }
                commandInput.value = '';
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

}

customElements.define('terminal-input', TerminalInput);

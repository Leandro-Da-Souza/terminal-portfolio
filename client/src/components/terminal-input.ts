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

    static get observedAttributes() {
        return ['disabled'];
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
            if (event.key === 'Enter') {
                const command = commandInput.value.trim().toLocaleLowerCase();
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

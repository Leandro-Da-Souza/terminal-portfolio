class TerminalInput extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.attachEventHandlers();
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
                .command-input {
                    width: 100%;
                    background-color: transparent;
                    border: none;
                    color: #0f0;
                    font-family: 'Courier New', Courier, monospace;
                }
                .command-input:focus {
                    outline: none;
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
                commandInput.focus();
            }
        });
    }

    private dispatchCommand(command: string): void {
        this.dispatchEvent(new CustomEvent('command', { detail: command, bubbles: true, composed: true }));
    }

}

customElements.define('terminal-input', TerminalInput);

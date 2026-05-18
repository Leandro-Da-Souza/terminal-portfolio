class TerminalWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }

    protected render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.styles()}
            ${this.markup()}
        `;

        this.attachEventListeners();
    }

    protected styles(): string {
        return `
            <style>
                .terminal-window {
                    background-color: #222;
                    color: #0f0;
                    font-family: 'Courier New', Courier, monospace;
                    width: 100dvw;
                    height: 100dvh;
                }
                header {
                    background-color: #333;
                    display: flex;
                    justify-content: space-between;
                    width: 100%;
                }
                .title {
                    width: 100%;
                    margin: 0;
                    padding: 0;
                }
                .controls {
                    display: inline-flex;
                    gap: 0.5em;
                    justify-content: flex-end;
                    width: 100%;
                    margin: 0.1em 0.5em;
                }
                .controls span {
                    cursor: pointer;
                    width: 1.5em;
                    height: 1.5em;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    background-color: #444;
                    border-radius: 0.25em;
                }
                .controls span:hover {
                    background-color: #555;
                }
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
            <section class="terminal-window">
                <header>
                    <h3 class="title">Terminal Portfolio</h3>
                    <section class="controls">
                        <span class="maximize">+</span>
                        <span class="minimize">_</span>
                        <span class="close">x</span>
                    </section>
                </header>
                <main>
                    <section class="content">
                        <p>Type 'help' to see available commands.</p>
                        <input type="text" class="command-input" placeholder="Enter command..." autofocus />
                    </section>
                </main>
            </section>
        `;
    }

    protected attachEventListeners(): void {
        this.commandHandler();
        this.maximize();
        this.minimize();
        this.close();
    }

    private commandHandler(): void {
        // Implement command handling logic here
        const commandInput = this.shadowRoot?.querySelector('.command-input') as HTMLInputElement;
        commandInput.addEventListener('keydown', (event) => {
            if (event.key === 'Enter') {
                const command = commandInput.value.trim();
                console.log('Command entered:', command);
                // Here you can implement command handling logic
                commandInput.value = '';
            }
        });
    }

    private maximize(): void {
        // Implement maximize functionality
        this.shadowRoot?.querySelector('.controls .maximize')?.addEventListener('click', () => {
            const terminal = this.shadowRoot?.querySelector('.terminal-window');
            console.log('Maximize clicked');
            console.log(terminal)
        });
    }

    private minimize(): void {
        // Implement minimize functionality
        this.shadowRoot?.querySelector('.controls .minimize')?.addEventListener('click', () => {
            const terminal = this.shadowRoot?.querySelector('.terminal-window');
            console.log('Minimize clicked');
            console.log(terminal)
        });
    }

    private close(): void {
        // Implement close functionality
        this.shadowRoot?.querySelector('.controls .close')?.addEventListener('click', () => {
            const terminal = this.shadowRoot?.querySelector('.terminal-window');
            console.log('Close clicked');
            console.log(terminal)
        });
    }
}

customElements.define('terminal-window', TerminalWindow);     
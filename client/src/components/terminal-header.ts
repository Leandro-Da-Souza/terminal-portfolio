class TerminalHeader extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open'})
    }

    connectedCallback() {
        this.render()
    }

    protected render(): void {
        if(!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.styles()}
            ${this.markup()}
        `;

        this.attachEventHandlers();
    }

    protected styles(): string {
        return `
            <style>
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
            </style>
        `;
    }

    protected markup(): string {
        return `
            <header>
                <h3 class="title">Terminal Portfolio</h3>
                <section class="controls">
                    <span class="maximize">+</span>
                    <span class="minimize">_</span>
                    <span class="close">x</span>
                </section>
            </header>
        `
    }

    protected attachEventHandlers(): void {
        this.maximize();
        this.minimize();
        this.close();
    }

    private maximize(): void {
        // Implement maximize functionality
        this.shadowRoot?.querySelector('.controls .maximize')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('maximize', { bubbles: true, composed: true }));
        });
    }

    private minimize(): void {
        // Implement minimize functionality
        this.shadowRoot?.querySelector('.controls .minimize')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('minimize', { bubbles: true, composed: true }));
        });
    }

    private close(): void {
        // Implement close functionality
        this.shadowRoot?.querySelector('.controls .close')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
        });
    }
}

customElements.define('terminal-header', TerminalHeader)
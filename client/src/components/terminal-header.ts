import { baseStyles } from "../styles/base";

class TerminalHeader extends HTMLElement {
    constructor() {
        super()
        this.attachShadow({ mode: 'open'})
    }

    connectedCallback() {
        this.render()
        this.attachEventHandlers();
    }

    protected render(): void {
        if(!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.styles()}
            ${this.markup()}
        `;

    }

    protected styles(): string {
        return `
            <style>
                ${baseStyles}
                header {
                    background-color: var(--terminal-surface);
    
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
    
                    width: 100%;
    
                    padding:
                        var(--space-xs)
                        var(--space-sm);
    
                    font-family: var(--font-terminal);
                }
    
                .title {
                    color: var(--terminal-text-bright);
    
                    font-size: 1rem;
                    font-weight: 700;
                }
    
                .controls {
                    display: inline-flex;
                    gap: var(--space-xs);
                }
    
                .controls span {
                    cursor: pointer;
    
                    width: 1.5rem;
                    height: 1.5rem;
    
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
    
                    background-color: var(--terminal-bg);
    
                    border-radius: var(--radius-sm);
    
                    color: var(--terminal-text);
    
                    transition: background-color 120ms ease;
                }
    
                .controls span:hover {
                    background-color: #3a3a3a;
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
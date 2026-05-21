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
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
    
                    width: 100%;
    
                    padding:
                        var(--space-sm)
                        var(--space-md);
    
                    background:
                        linear-gradient(
                            to bottom,
                            var(--terminal-header-top),
                            var(--terminal-header-bottom)
                        );
    
                    border:
                        1px solid
                        var(--terminal-border);
    
                    box-shadow:
                        inset 0 -1px 0 var(--terminal-highlight),
                        0 0 10px var(--terminal-shadow);
    
                    position: relative;
                }
    
                header::before {
                    content: '';
    
                    position: absolute;
    
                    top: 0;
                    left: 0;
                    right: 0;
    
                    height: 1px;
    
                    background:
                        var(--terminal-header-line);
                }
    
                .title {
                    color: var(--terminal-accent);
    
                    font-size: 0.75rem;
                    font-weight: 700;
    
                    text-transform: uppercase;
                    letter-spacing: 0.12em;
    
                    text-shadow:
                        0 0 6px var(--terminal-glow);
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
    
                    background-color: var(--terminal-surface);
    
                    border:
                        1px solid
                        var(--terminal-border);
    
                    color: var(--terminal-text-muted);
    
                    transition:
                        background-color 120ms ease,
                        color 120ms ease,
                        border-color 120ms ease;
                }
    
                .controls span:hover {
                    background-color: var(--terminal-panel);
    
                    border-color: var(--terminal-accent);
    
                    color: var(--terminal-accent);
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
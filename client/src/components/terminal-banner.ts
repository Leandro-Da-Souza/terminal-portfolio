class TerminalBanner extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    protected render() {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.styles()}
            ${this.markup()}
        `;
    }

    protected markup() {
        return `
            <pre class="banner">
    [ DZS SYSTEMS ] STATUS: ONLINE
    
    ██╗     ███████╗     ██████╗
    ╚═ DZS/TERM v2.4.19-alpha ═╝
            </pre>
        `;
    }

    protected styles() {
        return `
            <style>
                pre.banner {
                    margin: 0;
                    margin-top: var(--space-md);
    
                    color: var(--terminal-accent);
    
                    opacity: 0.30;
    
                    font-family: var(--font-terminal);
    
                    font-size: 0.70rem;
                    line-height: 1;
    
                    white-space: pre;
    
                    text-shadow:
                        0 0 8px var(--terminal-glow);
                }
            </style>
        `;
    }
}

customElements.define('terminal-banner', TerminalBanner);

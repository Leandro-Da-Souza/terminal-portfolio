class TerminalWindow extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }
    
    connectedCallback() {
        this.render();
    }

    render() {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.styles()}
            ${this.markup()}
        `;
    }

    styles() {
        return `
            <style>
                .terminal-window {
                    background-color: #000;
                    color: #0f0;
                    font-family: 'Courier New', Courier, monospace;
                }
            </style>
        `;
    }

    markup() {
        return `
            <section class="terminal-window">
                <header>My Terminal</header>
                <main>
                    <p>This is a custom terminal window component.</p>
                </main>
            </section>
        `;
    }
}

customElements.define('terminal-window', TerminalWindow);     
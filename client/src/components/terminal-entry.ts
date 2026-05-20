class TerminalEntry extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    protected render(): void {
        if(!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.styles()}
            ${this.markup()}
        `
    } 

    protected styles(): string {
        return `
            <style>
            </style>
        `;
    }

    protected markup(): string {
        return `
            <section>
                <span class="input">${this.sanitizeText(this.input)}</span>
                <br/>
                <span class="output">${this.sanitizeText(this.output)}</span>
            </section>
        `;
    }

    public get input(): string {
        return this.getAttribute('input') || "";
    }

    public get output(): string {
        return this.getAttribute('output') || "";
    }

    private sanitizeText(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
}

customElements.define('terminal-entry', TerminalEntry);
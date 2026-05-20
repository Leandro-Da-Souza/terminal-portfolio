import { baseStyles } from "../styles/base";

class TerminalEntry extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
    }

    public get input(): string {
        return this.getAttribute('input') || "";
    }

    public get output(): string {
        return this.getAttribute('output') || "";
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
                ${baseStyles}

                .entry {
                    display: flex;
                    flex-direction: column;
    
                    gap: var(--space-xs);
    
                    font-size: 0.875rem;
                    font-family: var(--font-terminal);
                }
    
                .input-line {
                    display: flex;
                    align-items: center;
    
                    gap: var(--space-sm);
    
                    color: var(--terminal-text);
                }
    
                .prompt {
                    color: var(--terminal-text);
                }
    
                .input {
                    color: var(--terminal-text-bright);
                }
    
                .output {
                    color: var(--terminal-text);
    
                    white-space: pre-wrap;
                    line-height: 1.5;
                }
            </style>
        `;
    }

    protected markup(): string {
        return `
            <section class="entry">
                <div class="input-line">
                    <span class="prompt">></span>
                    <span class="input">${this.sanitizeText(this.input)}</span>
                </div>
            
                <div class="output">
                    ${this.sanitizeText(this.output)}
                </div>
            </section>
        `;
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
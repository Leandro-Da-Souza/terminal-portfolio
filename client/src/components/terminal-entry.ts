import { baseStyles } from "../styles/base";

class TerminalEntry extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    connectedCallback() {
        this.render();
        this.renderOutputAnimation(this.output)
    }

    public get input(): string {
        return this.getAttribute('input') || "";
    }

    public get output(): string {
        return this.getAttribute('output') || "";
    }

    public get variant(): 'command' | 'system' {
        return (
            this.getAttribute('variant') as 'command' | 'system'
        ) || 'command';
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
    
                    padding:
                        var(--space-sm)
                        var(--space-md);
    
                    background:
                        linear-gradient(
                            to right,
                            var(--terminal-overlay),
                            transparent 30%
                        );
    
                    border-left:
                        2px solid
                        var(--terminal-border);
    
                    font-family: var(--font-terminal);
                    font-size: var(--font-terminal-size);
    
                    box-shadow:
                        inset 0 0 0 1px var(--terminal-highlight);
                }
    
                .entry.command {
                    margin-bottom: var(--space-lg);
                }
    
                .entry.system {
                    background: none;
    
                    border-left: none;
    
                    padding:
                        var(--space-xs)
                        0;
    
                    box-shadow: none;
    
                    margin-bottom: var(--space-xs);
                }
    
                .entry.system .output {
                    color: var(--terminal-accent);
    
                    opacity: 0.72;
    
                    text-transform: uppercase;
    
                    letter-spacing: 0.04em;
    
                    font-size: 0.65rem;
    
                    padding-left: var(--space-sm);
                }
    
                .input-line {
                    display: flex;
                    align-items: center;
    
                    gap: var(--space-sm);
    
                    color: var(--terminal-text-muted);
    
                    text-transform: uppercase;
                    letter-spacing: 0.04em;
                }
    
                .prompt {
                    color: var(--terminal-accent);
    
                    font-weight: 700;
    
                    text-shadow:
                        0 0 6px var(--terminal-glow);
                }
    
                .input {
                    color: var(--terminal-text-bright);
    
                    opacity: 0.92;
                }
    
                .output {
                    color: var(--terminal-text);
    
                    white-space: pre-wrap;
                    line-height: 1.7;
    
                    text-shadow:
                        0 0 8px var(--terminal-glow);
                }
            </style>
        `;
    }

    protected markup(): string {
        return `
            <section class="entry ${this.variant}">
                <div class="input-line">
                    ${this.variant === 'command' 
                        ? `
                            <span class="prompt">></span>
                            <span class="input">${this.sanitizeText(this.input)}</span>
                        `
                        : ''
                    }

                </div>
            
                <div class="output">
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

    private renderOutputAnimation(output: string) {
        const words = output.split(' ');
    
        const outputContainer =
            this.shadowRoot?.querySelector('.output');
    
        if (!outputContainer) return;
    
        outputContainer.textContent = '';
    
        words.forEach((word, index) => {
    
            setTimeout(() => {
                if(index === 0) {
                    outputContainer.textContent += `${word}`;
                } else {
                    outputContainer.textContent += ` ${word}`;
                }
                
                this.dispatchEvent(new CustomEvent('output-progress', {
                    bubbles: true,
                    composed: true
                }));
            }, index * 200);

        });
    }
}

customElements.define('terminal-entry', TerminalEntry);
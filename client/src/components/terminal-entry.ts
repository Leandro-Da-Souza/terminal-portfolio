import baseText from '../styles/components/base.css?inline';
import cssText from '../styles/components/terminal-entry.css?inline';

const terminalEntryStyleSheet = new CSSStyleSheet();
terminalEntryStyleSheet.replaceSync(cssText);

const baseStyleSheet = new CSSStyleSheet();
baseStyleSheet.replaceSync(baseText);

class TerminalEntry extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open',
        }).adoptedStyleSheets = [baseStyleSheet, terminalEntryStyleSheet];
    }

    static define(tag = 'terminal-entry'): void {
        if (!customElements.get(tag)) {
            customElements.define(tag, this);
        }
    }

    connectedCallback() {
        this.render();
        this.renderOutputAnimation(this.output);
    }

    public get input(): string {
        return this.getAttribute('input') || '';
    }

    public get output(): string {
        return this.getAttribute('output') || '';
    }

    public get variant(): 'command' | 'system' {
        return (this.getAttribute('variant') as 'command' | 'system') || 'command';
    }

    protected render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.markup()}
        `;
    }

    protected markup(): string {
        return `
            <section class="entry ${this.variant}">
                <div class="input-line">
                    ${
                        this.variant === 'command'
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

        const outputContainer = this.shadowRoot?.querySelector('.output');

        if (!outputContainer) return;

        outputContainer.textContent = '';

        words.forEach((word, index) => {
            setTimeout(() => {
                if (index === 0) {
                    outputContainer.textContent += `${word}`;
                } else {
                    outputContainer.textContent += ` ${word}`;
                }

                this.dispatchEvent(
                    new CustomEvent('output-progress', {
                        bubbles: true,
                        composed: true,
                    })
                );
            }, index * 200);
        });
    }
}

TerminalEntry.define();

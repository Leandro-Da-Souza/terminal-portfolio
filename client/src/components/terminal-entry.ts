import baseText from '../styles/components/base.css?inline';
import cssText from '../styles/components/terminal-entry.css?inline';

const terminalEntryStyleSheet = new CSSStyleSheet();
terminalEntryStyleSheet.replaceSync(cssText);

const baseStyleSheet = new CSSStyleSheet();
baseStyleSheet.replaceSync(baseText);

type OutputAnimationMode = 'word' | 'character';

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
        this.renderOutputAnimation(this.output, this.animationMode);
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

    public get animationMode(): OutputAnimationMode {
        const mode = this.getAttribute('animation-mode');

        if (mode === 'word' || mode === 'character') {
            return mode;
        }

        return this.variant === 'system' ? 'word' : 'character';
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

    private renderOutputAnimation(output: string, mode: OutputAnimationMode): void {
        switch (mode) {
            case 'word':
                this.renderWordOutputAnimation(output);
                break;

            case 'character':
                this.renderCharacterOutputAnimation(output);
                break;
        }
    }

    private renderWordOutputAnimation(output: string): void {
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

    private renderCharacterOutputAnimation(output: string): void {
        const outputContainer = this.shadowRoot?.querySelector('.output');

        if (!outputContainer) return;

        outputContainer.textContent = '';

        Array.from(output).forEach((character, index) => {
            setTimeout(() => {
                outputContainer.textContent += character;

                this.dispatchEvent(
                    new CustomEvent('output-progress', {
                        bubbles: true,
                        composed: true,
                    })
                );
            }, index * 24);
        });
    }
}

TerminalEntry.define();

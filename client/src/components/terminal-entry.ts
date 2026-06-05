import baseText from '../styles/components/base.css?inline';
import cssText from '../styles/components/terminal-entry.css?inline';

const terminalEntryStyleSheet = new CSSStyleSheet();
terminalEntryStyleSheet.replaceSync(cssText);

const baseStyleSheet = new CSSStyleSheet();
baseStyleSheet.replaceSync(baseText);

type OutputAnimationMode = 'word' | 'character';

type LinkSegment =
    | {
          type: 'text';
          value: string;
      }
    | {
          type: 'link';
          value: string;
          href: string;
      };

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

    public setLiveOutput(output: string, complete = false): void {
        this.setAttribute('output', output);

        const outputContainer = this.shadowRoot?.querySelector('.output');

        if (!outputContainer) return;

        if (complete) {
            this.renderLinkedOutput(outputContainer, output);
            this.dispatchOutputComplete();
        } else {
            outputContainer.textContent = output;
        }

        this.dispatchOutputProgress();
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
        if (output === '') {
            this.dispatchOutputComplete();
            return;
        }

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

                this.dispatchOutputProgress();

                if (index === words.length - 1) {
                    this.renderLinkedOutput(outputContainer, output);
                    this.dispatchOutputComplete();
                }
            }, index * 200);
        });
    }

    private renderCharacterOutputAnimation(output: string): void {
        const outputContainer = this.shadowRoot?.querySelector('.output');

        if (!outputContainer) return;

        outputContainer.textContent = '';

        const characters = Array.from(output);

        characters.forEach((character, index) => {
            setTimeout(() => {
                outputContainer.textContent += character;

                this.dispatchOutputProgress();

                if (index === characters.length - 1) {
                    this.renderLinkedOutput(outputContainer, output);
                    this.dispatchOutputComplete();
                }
            }, index * 16);
        });
    }

    private renderLinkedOutput(outputContainer: Element, output: string): void {
        outputContainer.textContent = '';

        this.getLinkSegments(output).forEach((segment) => {
            if (segment.type === 'text') {
                outputContainer.append(document.createTextNode(segment.value));
                return;
            }

            const link = document.createElement('a');
            link.href = segment.href;
            link.textContent = segment.value;

            if (!segment.href.startsWith('mailto:')) {
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
            }

            outputContainer.append(link);
        });
    }

    private getLinkSegments(output: string): LinkSegment[] {
        const linkPattern = /(https?:\/\/[^\s]+|[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,})/g;
        const segments: LinkSegment[] = [];
        let currentIndex = 0;

        for (const match of output.matchAll(linkPattern)) {
            const value = match[0];
            const matchIndex = match.index ?? 0;

            if (matchIndex > currentIndex) {
                segments.push({
                    type: 'text',
                    value: output.slice(currentIndex, matchIndex),
                });
            }

            segments.push({
                type: 'link',
                value,
                href: value.startsWith('http') ? value : `mailto:${value}`,
            });

            currentIndex = matchIndex + value.length;
        }

        if (currentIndex < output.length) {
            segments.push({
                type: 'text',
                value: output.slice(currentIndex),
            });
        }

        return segments;
    }

    private dispatchOutputProgress(): void {
        this.dispatchEvent(
            new CustomEvent('output-progress', {
                bubbles: true,
                composed: true,
            })
        );
    }

    private dispatchOutputComplete(): void {
        this.dispatchEvent(
            new CustomEvent('output-complete', {
                bubbles: true,
                composed: true,
            })
        );
    }
}

TerminalEntry.define();

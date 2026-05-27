import baseText from '../styles/components/base.css?inline';
import cssText from '../styles/components/terminal-header.css?inline';

const terminalHeaderStyleSheet = new CSSStyleSheet();
terminalHeaderStyleSheet.replaceSync(cssText);

const baseStyleSheet = new CSSStyleSheet();
baseStyleSheet.replaceSync(baseText);

class TerminalHeader extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open',
        }).adoptedStyleSheets = [baseStyleSheet, terminalHeaderStyleSheet];
    }

    static define(tag = 'terminal-header'): void {
        if (!customElements.get(tag)) {
            customElements.define(tag, this);
        }
    }

    connectedCallback() {
        this.render();
        this.attachEventHandlers();
    }

    protected render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.markup()}
        `;
    }

    protected markup(): string {
        return `
            <header>
                <h3 class="title">
                    DZS://RELAY
                    <span>TERMINAL NODE</span>
                </h3>
                <section class="controls">
                    <span class="close">x</span>
                </section>
            </header>
        `;
    }

    protected attachEventHandlers(): void {
        this.close();
    }

    private close(): void {
        this.shadowRoot?.querySelector('.controls .close')?.addEventListener('click', () => {
            this.dispatchEvent(new CustomEvent('close', { bubbles: true, composed: true }));
        });
    }
}

TerminalHeader.define();

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
            mode: 'open'
        }).adoptedStyleSheets = [
            baseStyleSheet,
            terminalHeaderStyleSheet
        ];
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
                    <span class="maximize">+</span>
                    <span class="minimize">_</span>
                    <span class="close">x</span>
                </section>
            </header>
        `;
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

TerminalHeader.define();

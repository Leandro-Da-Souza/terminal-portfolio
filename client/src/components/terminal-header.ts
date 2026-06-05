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

    static get observedAttributes(): string[] {
        return ['mode'];
    }

    connectedCallback() {
        this.render();
        this.attachEventHandlers();
    }

    attributeChangedCallback(): void {
        this.render();
        this.attachEventHandlers();
    }

    public get mode(): string | null {
        return this.getAttribute('mode');
    }

    protected render(): void {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.markup()}
        `;
    }

    protected markup(): string {
        const isMachineSpiritMode = this.mode === 'machine-spirit';
        const title = isMachineSpiritMode ? 'MACHINE SPIRIT' : 'DZS://RELAY';
        const subtitle = isMachineSpiritMode ? 'ONLINE' : 'TERMINAL NODE';

        return `
            <header>
                <h3 class="title">
                    ${title}
                    <span>${subtitle}</span>
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

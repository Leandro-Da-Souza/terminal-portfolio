import cssText from '../styles/components/terminal-banner.css?inline';

const terminalBannerStyleSheet = new CSSStyleSheet();
terminalBannerStyleSheet.replaceSync(cssText);

class TerminalBanner extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({
            mode: 'open',
        }).adoptedStyleSheets = [terminalBannerStyleSheet];
    }

    static define(tag = 'terminal-banner'): void {
        if (!customElements.get(tag)) {
            customElements.define(tag, this);
        }
    }

    connectedCallback() {
        this.render();
    }

    protected render() {
        if (!this.shadowRoot) return;

        this.shadowRoot.innerHTML = `
            ${this.markup()}
        `;
    }

    protected markup() {
        return `
            <pre class="banner">
    [ DZS SYSTEMS ] STATUS: ONLINE
    
    ██╗     ███████╗     ██████╗
    ╚═ DZS/TERM v2.4.19-alpha ═╝
            </pre>
        `;
    }
}

TerminalBanner.define();

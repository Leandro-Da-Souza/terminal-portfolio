import './styles/reset.css';
import './styles/theme.css'
import './components/terminal-window';
import './components/terminal-header';
import './components/terminal-input';
import './components/terminal-entry';


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <terminal-window></terminal-window>
`;
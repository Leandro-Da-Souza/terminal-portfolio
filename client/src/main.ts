import './reset.css';
import './components/terminal-window';
import './components/terminal-header';
import './components/terminal-input';


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <terminal-window></terminal-window>
`;
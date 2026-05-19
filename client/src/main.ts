import './reset.css';
import './components/terminal-window';
import './components/terminal-header';


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <terminal-window></terminal-window>
`;
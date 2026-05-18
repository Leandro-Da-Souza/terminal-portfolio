import './reset.css';
import './components/terminal-window';


document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <terminal-window></terminal-window>
`;
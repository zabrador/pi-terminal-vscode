const vscode = acquireVsCodeApi();
const terminal = new Terminal({ cursorBlink: true, fontSize: 13 });
function applyTheme() {
  const styles = getComputedStyle(document.body);
  const color = name => styles.getPropertyValue(`--vscode-${name}`).trim() || undefined;
  const theme = {
    background: color('terminal-background') || color('panel-background'),
    foreground: color('terminal-foreground'),
    cursor: color('terminalCursor-foreground') || color('terminal-foreground'),
    cursorAccent: color('terminalCursor-background') || color('terminal-background') || color('panel-background'),
    selectionBackground: color('terminal-selectionBackground'),
    selectionForeground: color('terminal-selectionForeground'),
    selectionInactiveBackground: color('terminal-inactiveSelectionBackground')
  };
  for (const name of ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']) {
    const suffix = name[0].toUpperCase() + name.slice(1);
    theme[name] = color(`terminal-ansi${suffix}`);
    theme[`bright${suffix}`] = color(`terminal-ansiBright${suffix}`);
  }
  terminal.options.theme = theme;
}
const fit = new FitAddon.FitAddon();
terminal.loadAddon(fit);
const container = document.getElementById('terminal');
terminal.open(container);
terminal.onData(data => vscode.postMessage({ type: 'input', data }));
terminal.onResize(({ cols, rows }) => vscode.postMessage({ type: 'resize', cols, rows }));
window.addEventListener('message', event => {
  if (event.data.type === 'output') {terminal.write(event.data.data);}
  if (event.data.type === 'reset') {
    terminal.write('', reset);
  }
});
new ResizeObserver(() => {
  if (container.clientWidth && container.clientHeight) {fit.fit();}
}).observe(container);
function reset() {
  terminal.reset();
  applyTheme();
  vscode.postMessage({ type: 'ready' });
  vscode.postMessage({ type: 'resize', cols: terminal.cols, rows: terminal.rows });
  terminal.focus();
}
reset();

const vscode = acquireVsCodeApi();
const terminal = new Terminal({ cursorBlink: true, fontSize: 13 });
const fit = new FitAddon.FitAddon();
terminal.loadAddon(fit);
const container = document.getElementById('terminal');
terminal.open(container);
terminal.onData(data => vscode.postMessage({ type: 'input', data }));
terminal.onResize(({ cols, rows }) => vscode.postMessage({ type: 'resize', cols, rows }));
window.addEventListener('message', event => {
  if (event.data.type === 'output') {terminal.write(event.data.data);}
  if (event.data.type === 'reset') {
    terminal.write('', () => {
      terminal.reset();
      vscode.postMessage({ type: 'ready' });
      vscode.postMessage({ type: 'resize', cols: terminal.cols, rows: terminal.rows });
      terminal.focus();
    });
  }
});
new ResizeObserver(() => {
  if (container.clientWidth && container.clientHeight) {fit.fit();}
}).observe(container);
vscode.postMessage({ type: 'ready' });
terminal.focus();

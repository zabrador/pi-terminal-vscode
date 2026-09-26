import * as vscode from 'vscode';
import * as pty from 'node-pty';
import { randomBytes } from 'node:crypto';
import { homedir } from 'node:os';

/** Registers the Pi view; its process starts when the view opens and stops when disposed. */
export function activate(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.window.registerWebviewViewProvider('piTerminal.pi', {
    resolveWebviewView(view) {
      let terminal: pty.IPty | undefined;
      const processDisposables: vscode.Disposable[] = [];
      const stop = () => {
        for (const disposable of processDisposables.splice(0)) {disposable.dispose();}
        terminal?.kill();
        terminal = undefined;
      };
      const root = context.extensionUri;
      const resource = (name: string) => view.webview.asWebviewUri(vscode.Uri.joinPath(root, ...name.split('/')));
      const nonce = randomBytes(24).toString('base64');
      view.webview.options = { enableScripts: true, localResourceRoots: [vscode.Uri.joinPath(root, 'media'), vscode.Uri.joinPath(root, 'node_modules', '@xterm')] };
      view.webview.html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${view.webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${resource('node_modules/@xterm/xterm/css/xterm.css')}">
  <link rel="stylesheet" href="${resource('media/webview.css')}">
  <title>Pi Terminal</title>
</head>
<body>
  <div id="terminal"></div>
  <script nonce="${nonce}" src="${resource('node_modules/@xterm/xterm/lib/xterm.js')}"></script>
  <script nonce="${nonce}" src="${resource('node_modules/@xterm/addon-fit/lib/addon-fit.js')}"></script>
  <script nonce="${nonce}" src="${resource('media/webview.js')}"></script>
</body>
</html>`;
      const restart = vscode.commands.registerCommand('piTerminal.restart', () => {
        stop();
        void view.webview.postMessage({ type: 'reset' });
      });
      const write = (data: string) => { void view.webview.postMessage({ type: 'output', data }); };
      const messages = view.webview.onDidReceiveMessage(message => {
        if (!message || typeof message !== 'object') {return;}
        if (message.type === 'ready' && !terminal) {
          stop();
          const active = vscode.window.activeTextEditor?.document.uri;
          const folder = (active && vscode.workspace.getWorkspaceFolder(active)) || vscode.workspace.workspaceFolders?.[0];
          try {
            const windows = process.platform === 'win32';
            const shell = windows ? process.env.ComSpec || 'cmd.exe' : process.env.SHELL || '/bin/sh';
            const args = windows ? ['/d', '/s', '/c', 'pi'] : ['-lic', 'exec pi'];
            terminal = pty.spawn(shell, args, {
              name: 'xterm-256color', cols: 80, rows: 24,
              cwd: folder?.uri.fsPath || homedir(),
              env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' }
            });
            processDisposables.push(terminal.onData(write), terminal.onExit(({ exitCode }) => {
              terminal = undefined;
              write(`\r\nPi exited (${exitCode}). Use Restart Pi to start again.\r\n`);
            }));
          } catch (error) { write(`\r\nCould not start Pi: ${String(error)}\r\n`); }
        } else if (message.type === 'input' && typeof message.data === 'string') {
          terminal?.write(message.data);
        } else if (message.type === 'resize' && Number.isInteger(message.cols) && Number.isInteger(message.rows) && message.cols >= 2 && message.cols <= 1000 && message.rows >= 1 && message.rows <= 1000) {
          terminal?.resize(message.cols, message.rows);
        }
      });
      const cleanup = new vscode.Disposable(() => {
        messages.dispose();
        restart.dispose();
        stop();
      });
      view.onDidDispose(() => cleanup.dispose());
      context.subscriptions.push(cleanup);
    }
  }, { webviewOptions: { retainContextWhenHidden: true } }));
}

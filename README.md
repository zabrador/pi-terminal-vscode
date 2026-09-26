# Pi Terminal

Run Pi in a single interactive VS Code pane. It opens in the Secondary Side Bar by default and can be moved like any other view.

Requires macOS, VS Code 1.138 or later, and Pi installed separately with `pi` available in your login shell. The workspace must be trusted.

Open **Pi Terminal** to start Pi in the active editor's workspace folder, the first workspace folder, or your home directory. Hiding the pane keeps Pi running. Reloading the window starts a fresh process; sessions are not restored.

## Development

1. Use Node.js 24 and run `npm ci`.
2. Install the workspace's recommended VS Code extensions. The esbuild problem matcher is required by the F5 build task.
3. Press F5 to open an Extension Development Host, then open **Pi Terminal** in its Secondary Side Bar.

Set breakpoints in `src/extension.ts`. After editing code or webview assets, reload the development window or restart the debug session.

- `npm run compile` checks types, lints, and builds the extension.
- `npm test` runs the activation smoke test in VS Code. It does not exercise the interactive Pi session.
- `npm run package` produces a production build in `dist/`; it does not create a VSIX.

The extension connects `node-pty` to xterm in the webview. The build keeps the native dependency external and ensures its spawn helper is executable. The webview loads xterm's browser bundles directly, with no separate frontend build.

import * as vscode from 'vscode';
import { accessSync, constants, existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { isAbsolute, join, resolve } from 'node:path';

/** Returns optional routing variables for the current workspace, or none if unavailable. */
export function plannotatorEnvironment(): Record<string, string> {
  const extension = vscode.extensions.getExtension('backnotprop.plannotator-webview');
  const workspace = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  if (process.platform === 'win32' || !extension?.isActive || !workspace ||
      !vscode.workspace.getConfiguration('plannotatorWebview').get('injectBrowser', true)) {
    return {};
  }
  const home = homedir();
  const configured = process.env.PLANNOTATOR_DATA_DIR?.trim();
  const legacy = join(home, '.plannotator');
  const xdg = process.env.XDG_DATA_HOME?.trim();
  const dataDir = configured
    ? configured === '~' ? home : configured.startsWith('~/') || configured.startsWith('~\\')
      ? join(home, configured.slice(2)) : resolve(configured)
    : existsSync(legacy) || !xdg || !isAbsolute(xdg) ? legacy : join(xdg, 'plannotator');
  try {
    const registry = JSON.parse(readFileSync(join(dataDir, 'vscode-ipc.json'), 'utf8'));
    const port = registry[workspace];
    const router = join(extension.extensionPath, 'bin', 'open-in-vscode');
    accessSync(router, constants.X_OK);
    if (Number.isInteger(port) && port > 0 && port <= 65535) {
      return { PLANNOTATOR_BROWSER: router, PLANNOTATOR_VSCODE_PORT: String(port) };
    }
  } catch {
    return {};
  }
  return {};
}

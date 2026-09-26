import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Pi Terminal', () => {
	test('activates', async () => {
		const extension = vscode.extensions.getExtension('zabrador.pi-terminal');
		assert.ok(extension);
		await extension.activate();
		assert.strictEqual(extension.isActive, true);
	});
});

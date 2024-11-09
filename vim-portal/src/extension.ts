import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('vimportalid.vimportal', () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const fileName = document.fileName;
			const cursorPosition = editor.selection.active;
			const lineNumber = cursorPosition.line + 1;
			const columnNumber = cursorPosition.character + 1;
			//const cmd = `nvim +${lineNumber} ${fileName}`;
			const cmd = `nvim "+call cursor(${lineNumber},${columnNumber})" "${fileName}"`;
			vscode.window.showInformationMessage(cmd);
			const terminalName = 'NeoVim Terminal';
			let terminal = vscode.window.terminals.find(t => t.name === terminalName);
			if (!terminal) {
				terminal = vscode.window.createTerminal(terminalName);
			}
			terminal.show();
			terminal.sendText(cmd);
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}

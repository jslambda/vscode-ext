import * as vscode from 'vscode';
import path from 'path';

function getIndexOfLastFunctionSymbol(symbolChain: vscode.DocumentSymbol[]): number {
	let indexOfLastFunction = 0;
	for (let index = 0; index < symbolChain.length; index++) {
		const symbol = symbolChain[index];
		const symbolIsFunc = (symbol.kind === vscode.SymbolKind.Method || symbol.kind === vscode.SymbolKind.Function);
		if (symbolIsFunc) {
			indexOfLastFunction = index;
		}
	}	
	if (indexOfLastFunction != 0) {
		return indexOfLastFunction;
	}
	// No function in the chain. Falling back to the index of the last element in the chain.
	return symbolChain.length - 1;
}

async function getQualifiedName(
	document: vscode.TextDocument,
	position: vscode.Position
): Promise<string | undefined> {
	// Execute the Document Symbol Provider command
	const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
		'vscode.executeDocumentSymbolProvider',
		document.uri
	);

	if (symbols) {
		// Find the innermost symbol that contains the position
		const symbolChain = findInnermostSymbolChain(symbols, position);
		if (symbolChain.length > 0) {
			const indexOfFunc = getIndexOfLastFunctionSymbol(symbolChain);
			// Build the qualified name up to the last function in the chain
			const names = symbolChain.slice(0, indexOfFunc+1).map((s) => s.name);
			return names.join('.');
		}
	}

	return undefined;
}

function findInnermostSymbolChain(
	symbols: vscode.DocumentSymbol[],
	position: vscode.Position,
	chain: vscode.DocumentSymbol[] = []
): vscode.DocumentSymbol[] {
	for (const symbol of symbols) {
		if (symbol.range.contains(position)) {
			chain.push(symbol);
			if (symbol.children && symbol.children.length > 0) {
				return findInnermostSymbolChain(symbol.children, position, chain);
			} else {
				return chain;
			}
		}
	}
	return chain;
}

function removeFileExtension(fullFileName: string): string {
	const result: string[] = [];
	let lastDotSeen = false;
	for (let i = fullFileName.length - 1; i >= 0; i--) {
		const c = fullFileName[i];
		if (lastDotSeen) {
			result.push(c);
		} else {
			if (c == '.') {
				lastDotSeen = true;
			}
		}
	}
	return result.toReversed().join('');
}

export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand("testcmdid.testcmd", () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const document = editor.document;
			const fileName = document.fileName;
			const cursorPosition = editor.selection.active;

			// Get the qualified name name
			const qualifiedNamePromise = getQualifiedName(document, cursorPosition);
			qualifiedNamePromise.then((qualifiedName) => {
				if (qualifiedName == undefined) {
					return;
				}
				vscode.window.showInformationMessage(`${qualifiedName}`);
				const fullFileNameWithoutExt = removeFileExtension(path.basename(fileName));
				// Show cmd in a terminal without executing it
				const cmd = `python -m unittest test ${fullFileNameWithoutExt}.${qualifiedName}`
				const terminalName = 'GenerateTest Command Terminal';
				let terminal = vscode.window.terminals.find(t => t.name === terminalName);
				if (!terminal) {
					terminal = vscode.window.createTerminal(terminalName);
				}
				terminal.show();
				terminal.sendText(cmd, false);
			}).catch((error) => {
				vscode.window.showInformationMessage(error);
			})
		}
	});

	context.subscriptions.push(disposable);
}

// This method is called when your extension is deactivated
export function deactivate() { }

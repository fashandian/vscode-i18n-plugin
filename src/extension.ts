// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { Marker } from './Marker';
import { getLocalesConfiguration } from './utils';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "vscode-i18n-plugin" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('i18n-plugin.helloWorld', () => {
		// The code you place here will be executed every time your command is executed
		// Display a message box to the user
		vscode.window.showInformationMessage('Hello World from vscode-i18n-plugin!');
	});
	context.subscriptions.push(disposable);

	const localesEntyPath = getLocalesConfiguration();

	if (!localesEntyPath || !/\.[a-zA-Z]+$/.test(localesEntyPath[2])) {
		vscode.window.showErrorMessage('i18n-plugin 无法获取到语言翻译入口文件，请先配置语言翻译入口文件!');
		return;
	}

	const marker = new Marker([localesEntyPath[1]]);

	marker.disposables.forEach(item => {
		context.subscriptions.push(item);
	});
}

// this method is called when your extension is deactivated
export function deactivate() { }

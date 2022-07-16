import * as vscode from 'vscode';
import { findFileByRootLocales, getLocalesConfiguration, getRegexpConfiguration, readFileContent } from './utils';

const decoration = vscode.window.createTextEditorDecorationType({
	textDecoration: 'line-through',
});

async function setTextDecorations(editor: vscode.TextEditor) {
	const localesEntyPath = getLocalesConfiguration();

	if (!localesEntyPath || !/\.[a-zA-Z]+$/.test(localesEntyPath[2])) {
		vscode.window.showErrorMessage('i18n-plugin 无法获取到语言翻译入口文件，请确保正确配置了语言翻译入口文件!');
		return;
	}

	const matchRegex = getRegexpConfiguration();

	if (!matchRegex) {
		vscode.window.showErrorMessage('i18n-plugin 无法获取到正则表达式，请确保正确设置了匹配的正则表达式!');
		return;
	}

	const regEx = new RegExp(`${matchRegex[1]}`, `${matchRegex[2]}`);
	const text = editor.document.getText();
	const smallNumbers: vscode.DecorationOptions[] = [];
	let match;
	let file, contentText = '';
	const workspaceUri = vscode.workspace.workspaceFolders?.[0]?.uri;
	if (workspaceUri) {
		const files = await findFileByRootLocales(vscode.Uri.joinPath(workspaceUri, localesEntyPath[1]));
		file = await readFileContent(vscode.Uri.joinPath(workspaceUri, localesEntyPath[1]), [`${localesEntyPath[2]}`], files);
	} else {
		vscode.window.showErrorMessage('i18n-plugin 无法获取工作空间!');
	}

	while ((match = regEx.exec(text))) {
		const startPos = editor.document.positionAt(match.index + match[1].length);
		const endPos = editor.document.positionAt(match.index + match[1].length + match[2].length);
		if (file) {
			const reg = new RegExp(`${match[2]}['"].*:\\s*['"](.*)['"]`);
			const result = file.match(reg);
			contentText = result ? result[1] : '';
		}
		const deco: vscode.DecorationOptions = {
			range: new vscode.Range(startPos, endPos),
			renderOptions: {
				after: {
					contentText,
				},
				light: {
					after: {
						color: 'rgb(175, 0, 219)',
						backgroundColor: 'rgba(0, 0, 0, 0.2)',
						margin: '0 10px'
					},
				},
				dark: {
					after: {
						color: 'rgb(197, 134, 192)',
						backgroundColor: 'rgba(255, 255, 255, 0.2)',
						margin: '0 10px'
					},
				}
			}
		};
		smallNumbers.push(deco);
		editor.setDecorations(decoration, []);
		editor.setDecorations(decoration, smallNumbers);
	}
}

export class Marker {
	disposables: vscode.Disposable[] = [];
	timeout: NodeJS.Timeout | undefined = undefined;

	constructor(localesRootPaths: string[]) {

		const { disposables } = this;
		const workspaceFolders = vscode.workspace.workspaceFolders;
		
		if (workspaceFolders) {
			localesRootPaths.map(item => vscode.Uri.joinPath(workspaceFolders[0].uri, item)).forEach(i18nPath => {
				const i18nDirWatcher = vscode.workspace.createFileSystemWatcher(
					`${i18nPath.path.replace(/^\//, '')}/**`
				);
				i18nDirWatcher.onDidChange(() => this.debounceUpdate(this.updateVisibleEditors));
				i18nDirWatcher.onDidCreate(() => this.debounceUpdate(this.updateVisibleEditors));
				i18nDirWatcher.onDidDelete(() => this.debounceUpdate(this.updateVisibleEditors));
				disposables.push(i18nDirWatcher);
			});
		}

		disposables.push(
			vscode.window.onDidChangeActiveTextEditor(() => this.debounceUpdate(this.update)),
			vscode.workspace.onDidChangeTextDocument(() => this.debounceUpdate(this.update))
		);

		this.updateVisibleEditors();
	}

	debounceUpdate(updateFunc: () => void) {
		if (this.timeout) {
			clearTimeout(this.timeout);
			this.timeout = undefined;
		}
		this.timeout = setTimeout(() => updateFunc(), 500);
	}

	update() {
		const activeEditor = vscode.window.activeTextEditor;
		if (!activeEditor) {
			return;
		}
		setTextDecorations(activeEditor);
	}

	updateVisibleEditors() {
		vscode.window.visibleTextEditors.forEach(item => {
			setTextDecorations(item);
		});
	}

}

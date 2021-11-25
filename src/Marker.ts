import * as vscode from 'vscode';
import { readFileContent } from './utils';

const locales = 'zh-CN';

const decoration = vscode.window.createTextEditorDecorationType({
	textDecoration: 'line-through',
});

async function setTextDecorations(editor: vscode.TextEditor) {
	const text = editor.document.getText();
	const regEx = /(formatMessage.*id:\s*['"])(.*)['"].*/g;
	const smallNumbers: vscode.DecorationOptions[] = [];
	let match;
  let file, contentText = '';
  if (vscode.workspace.workspaceFolders?.[0].uri) {
    file = await readFileContent(vscode.Uri.joinPath(vscode.workspace.workspaceFolders?.[0].uri, `src/locales`), [`${locales}`]);
  }
	while ((match = regEx.exec(text))) {
		const startPos = editor.document.positionAt(match.index + match[1].length);
		const endPos = editor.document.positionAt(match.index + match[1].length + match[2].length);
    if (file) {
      const reg = new RegExp(`${match[2]}['"].*:\s*['"](.*)['"],`);
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

// TODO: 开放可配置
const i18nPaths: string[] = ['src/locales'];

export class Marker {
  disposables: vscode.Disposable[] = [];
  timeout: NodeJS.Timeout | undefined = undefined;

  constructor() {
    const { disposables } = this;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders) {
      i18nPaths.map(item => vscode.Uri.joinPath(workspaceFolders[0].uri, item)).forEach(i18nPath => {
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
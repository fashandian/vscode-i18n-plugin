import * as vscode from 'vscode';

export async function readFileContent(uri: vscode.Uri, filePath: string[], files: string[], result = ''): Promise<string> {
  for (const item of filePath) {
    const fileMatch = item.match(/([^\/\.]*)(\.[A-Za-z]+)?$/);
    if (!fileMatch) {
      continue;
    }

    let fileBuffer;
    try {
      const index = files.findIndex(file => file.includes(fileMatch[1]));
      const filePath = fileMatch[2] ? item : item.replace(fileMatch[1], files[index]);
      fileBuffer = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(uri, `${filePath}`));
    } catch (error) {
      fileBuffer = '';
    }
    const fileContent = fileBuffer.toString();
    const importCode: string[] = [];
    result = `${result}\n${fileContent}`;

    const regEx = /import.*from\s*['"](.*)['"]/g;
    let match;
    while ((match = regEx.exec(fileContent))) {
      match[1] && importCode.push(match[1]);
    }

    if (importCode.length) {
      return readFileContent(uri, importCode, files, result);
    }
  }

  return result;
}

export async function findFileByRootLocales(rootPath: vscode.Uri, result: string[] = []): Promise<string[]> {
  const dirs = await vscode.workspace.fs.readDirectory(rootPath);

  const folders = dirs.reduce((prev, next) => {
    if (next[1] === 2) {
      prev.push(next[0]);
    } else {
      result.push(next[0]);
    }
    return prev;
  }, [] as string[]);
  
  for(const item of folders) {
    return findFileByRootLocales(vscode.Uri.joinPath(rootPath, item), result);
  }

  return result;
}

export function getLocalesConfiguration() {
  const localesEntryFile: string = vscode.workspace.getConfiguration('vscI18n').get('locales') || `src/locales/zh-CN.js`;
  return localesEntryFile.match(/(.+)\/([^\/]*)$/);
}

export function getRegexpConfiguration() {
  // /(formatMessage[^'"`]*\s*id:\s*['"`])([^'"`]*)['"`]/g
	const matchRegex: string = vscode.workspace.getConfiguration('vscI18n').get('matchRegexp') || '/(formatMessage[^\'"`]*[\'"`])([^\'"`]*)[\'"`]/g';
  const result = matchRegex.match(/^\/([^\/]+)\/([^\/]*)$/);
  return result;
}
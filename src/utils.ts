import * as vscode from 'vscode';

export async function readFileContent(uri: vscode.Uri, filePath: string[], result = ''): Promise<string> {
  for(const item of filePath) {
    let fileBuffer;
    try {
      fileBuffer = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(uri, `${item}.ts`));
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
      return readFileContent(uri, importCode, result);
    }
  }

  return result;
}
import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  console.log('extension activated')

  const wholeLineDecoration = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    after: {
      contentText: 'this line is active',
      margin: '0 0 0 20px',
      color: '#3399FF',
    },
  })

  let currentLine: number
  let startPos: vscode.Position
  let endPos: vscode.Position
  let range: vscode.Range

  vscode.window.onDidChangeTextEditorSelection((event) => {
    if (event.textEditor === vscode.window.activeTextEditor) {
      if (currentLine !== event.selections[0].active.line) {
        currentLine = event.selections[0].active.line

        startPos = new vscode.Position(currentLine, 0)
        endPos = new vscode.Position(currentLine, 0)

        range = new vscode.Range(startPos, endPos)

        event.textEditor.setDecorations(wholeLineDecoration, [range])
      }
    }
  })
}

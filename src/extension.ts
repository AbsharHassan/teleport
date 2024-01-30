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

  let prevLine: number

  let prevRange: vscode.Range
  let currentRange: vscode.Range
  let flagChange: boolean

  vscode.workspace.onDidChangeTextDocument((event) => {
    prevLine = event.contentChanges[0].range.start.line
  })

  vscode.window.onDidChangeTextEditorSelection((event) => {
    // if (event.textEditor === vscode.window.activeTextEditor) {
    //   if (currentLine !== event.selections[0].active.line) {
    //     currentLine = event.selections[0].active.line

    //     startPos = new vscode.Position(currentLine, 0)
    //     endPos = new vscode.Position(currentLine, 0)

    //     range = new vscode.Range(startPos, endPos)

    //     event.textEditor.setDecorations(wholeLineDecoration, [range])
    //   }
    // }

    if (event.textEditor === vscode.window.activeTextEditor) {
      if (currentLine !== event.selections[0].active.line) {
        currentLine = event.selections[0].active.line

        if (Math.abs(currentLine - prevLine) > 3) {
        }
      }
    }
  })
}

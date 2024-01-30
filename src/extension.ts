import * as vscode from 'vscode'

export function activate(context: vscode.ExtensionContext) {
  console.log('extension activated')

  let currentLine: number
  let startPos: vscode.Position
  let endPos: vscode.Position
  let range: vscode.Range

  let prevLine: number

  let customDecoration: vscode.TextEditorDecorationType

  //   vscode.workspace.onDidChangeTextDocument((event) => {
  //     prevLine = event.contentChanges[0].range.start.line

  //     if (Math.abs(currentLine - prevLine) > 3) {
  //       customDecoration.dispose()
  //     }
  //   })

  vscode.window.onDidChangeTextEditorSelection((event) => {
    if (event.textEditor === vscode.window.activeTextEditor) {
      if (currentLine !== event.selections[0].active.line) {
        currentLine = event.selections[0].active.line

        if (Math.abs(currentLine - prevLine) > 3) {
          startPos = new vscode.Position(currentLine, 0)
          endPos = new vscode.Position(currentLine, Number.MAX_VALUE)
          range = new vscode.Range(startPos, endPos)

          event.textEditor.setDecorations(
            updateDecoration(`you came from line ${prevLine + 1}`),
            [range]
          )

          prevLine = currentLine
        } else {
          customDecoration?.dispose()
          prevLine = currentLine
        }
      }
    }
  })

  const updateDecoration = (contentText: string) => {
    customDecoration?.dispose()

    customDecoration = vscode.window.createTextEditorDecorationType({
      isWholeLine: true,
      backgroundColor: 'black',
      cursor: 'pointer',
      after: {
        contentText,
        margin: '0 0 0 20px',
        color: '#3399FF',
        backgroundColor: 'black',
      },
    })

    return customDecoration
  }
}

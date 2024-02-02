import * as vscode from 'vscode'

import { WormholeCodeLensProvider } from './WormholeCodeLensProvider'

export function activate(context: vscode.ExtensionContext) {
  console.log('extension activated')

  const disposables = []

  const codelensProvider = new WormholeCodeLensProvider()

  disposables.push(
    vscode.languages.registerCodeLensProvider('*', codelensProvider)
  )

  disposables.push(
    vscode.commands.registerCommand('teleport.showMessage', (...args) => {
      const editor = vscode.window.activeTextEditor

      if (editor) {
        const line = args[0].line
        const character = Number.MAX_VALUE
        const range = new vscode.Range(line, character, line, character)

        editor.selection = new vscode.Selection(range.start, range.end)
        editor.revealRange(range)
      }
    })
  )

  context.subscriptions.push(...disposables)
}

// let currentLine: number
// let startPos: vscode.Position
// let endPos: vscode.Position
// let range: vscode.Range

// let prevLine: number

// let customDecoration: vscode.TextEditorDecorationType

// vscode.window.onDidChangeTextEditorSelection((event) => {
//   if (event.textEditor === vscode.window.activeTextEditor) {
//     if (currentLine !== event.selections[0].active.line) {
//       currentLine = event.selections[0].active.line

//       if (Math.abs(currentLine - prevLine) > 3) {
//         startPos = new vscode.Position(currentLine, 0)
//         endPos = new vscode.Position(currentLine, Number.MAX_VALUE)
//         range = new vscode.Range(startPos, endPos)

//         const decoration = {
//           range,
//           hoverMessage: new vscode.MarkdownString(
//             `[Click here](command:teleport.showMessage)`
//           ),
//         }

//         event.textEditor.setDecorations(
//           updateDecoration(`you came from line ${prevLine + 1}`),
//           [decoration]
//         )

//         prevLine = currentLine
//       } else {
//         customDecoration?.dispose()
//         prevLine = currentLine
//       }
//     }
//   }
// })

// const updateDecoration = (contentText: string) => {
//   customDecoration?.dispose()

//   customDecoration = vscode.window.createTextEditorDecorationType({
//     isWholeLine: true,
//     backgroundColor: 'black',
//     cursor: 'pointer',
//     after: {
//       contentText,
//       margin: '0 0 0 20px',
//       color: '#3399FF',
//       backgroundColor: 'black',
//     },
//   })

//   return customDecoration
// }

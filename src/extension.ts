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
    vscode.commands.registerCommand(
      'teleport.teleportToWormhole',
      (...args) => {
        const editor = vscode.window.activeTextEditor

        if (editor) {
          const line = args[0].line
          const character = Number.MAX_VALUE
          const range = new vscode.Range(line, character, line, character)

          editor.selection = new vscode.Selection(range.start, range.end)
          editor.revealRange(range, vscode.TextEditorRevealType.InCenter)

          // fadeOutDecoration(editor, range)
          blinkingDecoration(editor, range)
        }
      }
    )
  )

  context.subscriptions.push(...disposables)
}

const fadeOutDecoration = (
  editor: vscode.TextEditor,
  range: vscode.Range
): void => {
  let opacity = 0.5
  let decoration: vscode.TextEditorDecorationType

  const interval = setInterval((): void => {
    opacity -= 0.01

    if (opacity <= 0) {
      decoration?.dispose()
      clearInterval(interval)
    } else {
      console.log(opacity)

      decoration?.dispose()

      decoration = vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: `rgba(100, 30, 255, ${opacity})`,
      })

      editor.setDecorations(decoration, [range])
    }
  }, 5)
}

const blinkingDecoration = (
  editor: vscode.TextEditor,
  range: vscode.Range,
  blinkCount = 10,
  blinkGap = 1000
): void => {
  let count = blinkCount
  let decoration: vscode.TextEditorDecorationType

  const interval = setInterval((): void => {
    count--

    if (count <= 0) {
      decoration?.dispose()
      clearInterval(interval)
    } else {
      decoration?.dispose()

      if (count % 2 !== 0) {
        decoration = vscode.window.createTextEditorDecorationType({
          isWholeLine: true,
          backgroundColor: `rgba(100, 30, 255, 1.0)`,
        })

        editor.setDecorations(decoration, [range])
      }
    }
  }, blinkGap)
}

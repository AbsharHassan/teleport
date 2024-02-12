import * as vscode from 'vscode'

import { WormholeCodeLensProvider } from './WormholeCodeLensProvider'
import { disappearingDecoration } from './utils/decoratorFunctions'

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
          // blinkingDecoration(editor, range)
          disappearingDecoration(editor, range)
        }
      }
    )
  )

  context.subscriptions.push(...disposables)
}

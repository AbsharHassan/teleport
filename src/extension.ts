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
        codelensProvider.teleport(args[0])
      }
    ),

    vscode.commands.registerCommand('teleport.teleportBack', () => {
      codelensProvider.teleport(-1)
    }),

    vscode.commands.registerCommand('teleport.teleportForward', () => {
      codelensProvider.teleport(1)
    })
  )

  context.subscriptions.push(...disposables)
}

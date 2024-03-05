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
    )
  )

  context.subscriptions.push(...disposables)
}

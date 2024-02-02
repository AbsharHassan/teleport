import * as vscode from 'vscode'

export class WormholeCodeLensProvider implements vscode.CodeLensProvider {
  constructor() {
    vscode.window.onDidChangeTextEditorSelection((event) => {
      this.cursor = new vscode.Position(event.selections[0].active.line, 0)

      this._onDidChangeCodeLenses.fire()
    })
  }

  private cursor: vscode.Position = new vscode.Position(0, 0)
  private currentLine: vscode.Position = new vscode.Position(0, 0)
  private prevLine: vscode.Position = new vscode.Position(0, 0)

  private codeLenses: vscode.CodeLens[] = []

  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>()
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    this.codeLenses = []

    let line = new vscode.Position(0, 0)
    let range = new vscode.Range(this.cursor, this.cursor)
    this.codeLenses.push(new vscode.CodeLens(range))

    console.log('new code lens created')

    return this.codeLenses
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ) {
    codeLens.command = {
      title: 'You came from line: ' + (this.prevLine.line + 1),
      // tooltip: 'Use this to navigate between your recent most changes',
      command: 'teleport.showMessage',
      arguments: [this.prevLine],
    }

    this.prevLine = this.cursor

    return codeLens
  }
}

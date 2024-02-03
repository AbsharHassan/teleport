import * as vscode from 'vscode'

export class WormholeCodeLensProvider implements vscode.CodeLensProvider {
  constructor() {
    vscode.window.onDidChangeTextEditorSelection((event) => {
      this.currentLine = new vscode.Position(event.selections[0].active.line, 0)

      console.log({ currentLine: this.currentLine.line })
      console.log({ prevLine: this.prevLine.line })
      console.log({ oldestLine: this.oldestLine.line })

      // if (this.currentLine.line === this.oldestLine.line) {
      //   this.inHistory = true
      // } else {
      //   this.inHistory = false
      // }

      this.cursor = this.currentLine

      this._onDidChangeCodeLenses.fire()
    })
  }

  private cursor: vscode.Position = new vscode.Position(0, 0)
  private currentLine: vscode.Position = new vscode.Position(0, 0)
  private prevLine: vscode.Position = new vscode.Position(0, 0)
  private oldestLine: vscode.Position = new vscode.Position(0, 0)
  private inHistory: boolean = false

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

    let range = new vscode.Range(this.cursor, this.cursor)

    if (this.inHistory) {
      let rangePlusOne = new vscode.Range(
        this.cursor.line,
        1,
        this.cursor.line,
        1
      )

      this.codeLenses.push(new vscode.CodeLens(range))
      this.codeLenses.push(new vscode.CodeLens(rangePlusOne))
    } else {
      this.codeLenses.push(new vscode.CodeLens(range))
    }

    return this.codeLenses
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ) {
    // console.log(codeLens)

    // if (this.inHistory) {
    //   switch (codeLens.range.start.character) {
    //     case 0:
    //       codeLens.command = {
    //         title: 'Go forward to line: ' + (this.prevLine.line + 1),
    //         command: 'teleport.showMessage',
    //         arguments: [this.prevLine],
    //       }
    //       break
    //     case 1:
    //       codeLens.command = {
    //         title: 'Go even further back to line: ' + (this.oldestLine.line + 1),
    //         command: 'teleport.showMessage',
    //         arguments: [this.prevLine],
    //       }
    //   }
    // }

    codeLens.command = {
      title: 'You came from line: ' + (this.prevLine.line + 1),
      // tooltip: 'Use this to navigate between your recent most changes',
      command: 'teleport.showMessage',
      arguments: [this.prevLine],
    }

    this.oldestLine = this.prevLine

    this.prevLine = this.cursor

    return codeLens
  }
}

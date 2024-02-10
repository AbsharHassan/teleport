import * as vscode from 'vscode'

export class WormholeCodeLensProvider implements vscode.CodeLensProvider {
  constructor() {
    vscode.window.onDidChangeTextEditorSelection((event) => {
      const currentLine = new vscode.Position(
        event.selections[0].active.line,
        0
      )

      const temp = this.lineHistoryArray.findIndex((position) => {
        return position.line === currentLine.line
      })

      if (temp > -1) {
        console.log(temp)

        this.selectedHistoryIndex = temp
        this.cursor = this.lineHistoryArray[temp]
        this.inHistory = true
      } else {
        this.inHistory = false

        // update the history
        this.lineHistoryArray[3] = this.lineHistoryArray[2]
        this.lineHistoryArray[2] = this.lineHistoryArray[1]
        this.lineHistoryArray[1] = this.lineHistoryArray[0]

        this.lineHistoryArray[0] = new vscode.Position(
          event.selections[0].active.line,
          0
        )
        this.cursor = this.lineHistoryArray[0]
      }

      // this.lineHistoryArray.map((point, index) => {
      //   console.log(`${index}: ` + point.line)
      // })

      this._onDidChangeCodeLenses.fire()
    })
  }

  private cursor: vscode.Position = new vscode.Position(0, 0)
  private selectedHistoryIndex: number = 1
  private currentLine: vscode.Position = new vscode.Position(0, 0)
  private prevLine: vscode.Position = new vscode.Position(0, 0)
  private oldestLine: vscode.Position = new vscode.Position(0, 0)

  private dummyPosition = new vscode.Position(0, 0)

  private lineHistoryArray: vscode.Position[] = [
    this.dummyPosition,
    this.dummyPosition,
    this.dummyPosition,
    this.dummyPosition,
  ]

  public inHistory: boolean = false

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
    if (!this.inHistory) {
      codeLens.command = {
        title: 'You came from line: ' + (this.lineHistoryArray[1]?.line + 1),
        tooltip: 'Use this to navigate between your recent most changes',
        command: 'teleport.showMessage',
        arguments: [this.lineHistoryArray[1]],
      }
    } else {
      switch (codeLens.range.start.character) {
        case 0:
          codeLens.command = {
            title:
              'Go forward to line: ' +
              (this.lineHistoryArray[this.selectedHistoryIndex - 1].line + 1),
            command: 'teleport.showMessage',
            arguments: [this.lineHistoryArray[this.selectedHistoryIndex - 1]],
          }
          break
        case 1:
          codeLens.command = {
            title:
              'Go even further back to line: ' +
              (this.lineHistoryArray[this.selectedHistoryIndex + 1].line + 1),
            command: 'teleport.showMessage',
            arguments: [this.lineHistoryArray[this.selectedHistoryIndex + 1]],
          }
      }
    }

    return codeLens
  }
}

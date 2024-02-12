import * as vscode from 'vscode'

export class WormholeCodeLensProvider implements vscode.CodeLensProvider {
  constructor(wormholeCount = 4) {
    this.wormholeCount = wormholeCount

    const dummyPosition = new vscode.Position(0, 0)

    for (let i = 0; i < wormholeCount; i++) {
      this.lineHistoryArray[i] = dummyPosition
    }

    vscode.window.onDidChangeTextEditorSelection((event) => {
      const currentLine = new vscode.Position(
        event.selections[0].active.line,
        0
      )

      const currentLineHistoryIndex = this.lineHistoryArray.findIndex(
        (position) => {
          return position.line === currentLine.line
        }
      )

      if (currentLineHistoryIndex > -1) {
        this.selectedHistoryIndex = currentLineHistoryIndex
        this.cursor = this.lineHistoryArray[currentLineHistoryIndex]
        this.inHistory = true
      } else {
        this.inHistory = false

        // update the history
        for (let i = this.lineHistoryArray.length - 1; i > 0; i--) {
          this.lineHistoryArray[i] = this.lineHistoryArray[i - 1]
        }

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

  private wormholeCount: number = 4
  private cursor: vscode.Position = new vscode.Position(0, 0)
  private selectedHistoryIndex: number = 1
  private lineHistoryArray: vscode.Position[] = []

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
      if (this.selectedHistoryIndex + 1 < this.wormholeCount) {
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
        title:
          '(add hotkeys) You came from line: ' +
          (this.lineHistoryArray[1]?.line + 1),
        tooltip: 'Use this to navigate between your recent most changes',
        command: 'teleport.teleportToWormhole',
        arguments: [this.lineHistoryArray[1]],
      }
    } else {
      switch (codeLens.range.start.character) {
        case 0:
          codeLens.command = {
            title:
              '(add hotkeys) Go forward to line: ' +
              (this.lineHistoryArray[this.selectedHistoryIndex - 1].line + 1),
            command: 'teleport.teleportToWormhole',
            arguments: [this.lineHistoryArray[this.selectedHistoryIndex - 1]],
          }
          break
        case 1:
          codeLens.command = {
            title:
              `${
                this.selectedHistoryIndex > 0
                  ? '(add hotkeys) Go even further back to line: '
                  : '(add hotkeys) You came from line: '
              }` +
              (this.lineHistoryArray[this.selectedHistoryIndex + 1].line + 1),
            command: 'teleport.teleportToWormhole',
            arguments: [this.lineHistoryArray[this.selectedHistoryIndex + 1]],
          }
      }
    }

    return codeLens
  }
}

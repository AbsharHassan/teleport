import * as vscode from 'vscode'

// flow: store the line where there was a change and when a line is selected, navigate to that line. Add a delay when typing the new line or perhaps wait until the user navigates away and then remove the codelens. Starting with a simple approach to grouping changes

export class WormholeCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>()
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event

  private updateWorkingHistory = (currentLine: number) => {
    const newRange = new vscode.Range(
      // this is done to prevent -ve values for range start
      Math.max(currentLine - this.linesFromFirstChange, 0),
      0,
      currentLine + this.linesFromFirstChange,
      0
    )

    let shouldIgnoreChange = false

    // // for-loop chosen instead of .map() in order to incorporate break operator, since .intersetion() method may be costly
    // for (let i = 0; i < this.changesRangesHistoryArray.length; i++) {
    //   const intersects = this.changesRangesHistoryArray[i]?.intersection(
    //     newRange
    //   )
    //     ? true
    //     : false
    //   if (intersects) {
    //     shouldIgnoreChange = true
    //     break
    //   }
    // }

    // only to check the recent most change
    if (this.changesRangesHistoryArray[0]?.intersection(newRange)) {
      shouldIgnoreChange = true
      return
    }

    let inRangeHistoryIndex = -1

    // for-loop chosen instead of .map() in order to incorporate break operator, since .contains() method may be costly
    for (let i = 0; i < this.changesRangesHistoryArray.length; i++) {
      const contains = this.changesRangesHistoryArray[i]?.contains(newRange)
      if (contains) {
        inRangeHistoryIndex = i
        break
      }
    }

    if (inRangeHistoryIndex > -1) {
      this.changesRangesHistoryArray.splice(inRangeHistoryIndex, 1)
      this.changesRangesHistoryArray.unshift(newRange)
    } else {
      // remove the last history element and shift all positions to accomodate the new value
      for (let i = this.changesRangesHistoryArray.length - 1; i > 0; i--) {
        this.changesRangesHistoryArray[i] =
          this.changesRangesHistoryArray[i - 1]
      }

      this.changesRangesHistoryArray[0] = newRange
    }
  }

  private logHistory = () => {
    console.log('starting')
    this.changesRangesHistoryArray.map((range, index) => {
      console.log(index + ': ' + range?.start.line)
    })
    console.log('ending')
  }

  /**
   * toggleBrowsingHistory
   */
  public toggleBrowsingHistory(value: boolean) {
    this.browsingHistory = value
  }

  private wormholeCount = 4
  private linesFromFirstChange = 0
  private codeLenses: vscode.CodeLens[] = []
  private workingLinesHistoryArray: number[] = []
  private changesRangesHistoryArray: (vscode.Range | undefined)[] = []
  private showCodeLenses = false
  private codeLensLine: number = 0
  private prevWorkingLine = -1

  private browsingHistory = false
  // private browsingIndex
  private visibleIndex = 0

  constructor(wormholeCount = 4) {
    this.wormholeCount = wormholeCount

    for (let i = 0; i < wormholeCount; i++) {
      this.workingLinesHistoryArray[i] = -1
    }

    for (let i = 0; i < wormholeCount; i++) {
      this.changesRangesHistoryArray[i] = undefined
    }

    vscode.workspace.onDidChangeTextDocument((event) => {
      const currentLine = event.contentChanges[0].range.start.line

      if (currentLine !== this.prevWorkingLine) {
        this.updateWorkingHistory(currentLine)

        this.prevWorkingLine = currentLine
      }
    })

    vscode.window.onDidChangeTextEditorSelection((event) => {
      const currentLine = event.selections[0].start.line

      // To make sure the codeLens doesnt change while the user is currently working in the recentmost range
      if (currentLine === this.changesRangesHistoryArray[0]?.start.line) {
        this.visibleIndex = 1
      } else {
        this.visibleIndex = 0
      }
      this.codeLensLine = currentLine
      this.showCodeLenses = true

      this._onDidChangeCodeLenses.fire()
    })
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    console.log('provider')

    if (!this.showCodeLenses) {
      return []
    }

    if (this.browsingHistory) {
    }

    this.codeLenses = []

    let range = new vscode.Range(this.codeLensLine, 0, this.codeLensLine, 0)

    this.codeLenses.push(new vscode.CodeLens(range))

    return this.codeLenses
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ) {
    codeLens.command = {
      title:
        'you were working on: ' +
        //@ts-ignore
        (this.changesRangesHistoryArray[this.visibleIndex]?.start.line + 1),
      command: 'teleport.teleportToWormhole',
      arguments: [this.changesRangesHistoryArray[this.visibleIndex]],
    }

    return codeLens
  }
}

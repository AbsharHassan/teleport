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
    }

    // if (shouldIgnoreChange) {
    //   // console.log('starting')

    //   // this.changesRangesHistoryArray.map((range) => {
    //   //   console.log({ start: range?.start.line, end: range?.end.line })
    //   // })

    //   // console.log('ending')
    //   return
    // }

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
      for (let i = this.changesRangesHistoryArray.length - 1; i > 0; i--) {
        this.changesRangesHistoryArray[i] =
          this.changesRangesHistoryArray[i - 1]
      }

      this.changesRangesHistoryArray[0] = newRange
    }
  }

  private debouncingFunc = (cb: any, delay = 100) => {
    let timeout: any

    return (...args: any) => {
      clearTimeout(timeout)

      timeout = setTimeout(() => {
        cb(...args)
      }, delay)
    }
  }

  private debouncedUpdateWorkingHistory = this.debouncingFunc(
    this.updateWorkingHistory
  )

  private wormholeCount = 4
  private linesFromFirstChange = 0
  private codeLenses: vscode.CodeLens[] = []
  private workingLine: number = -1
  private workingLinesHistoryArray: number[] = []
  private changesRangesHistoryArray: (vscode.Range | undefined)[] = []
  private showCodeLenses = false
  private codeLensLine: number = 0
  private prevWorkingLine = -1
  private prevSelectionLine = -1

  private lineToAdd = -1

  private oldLenses = false

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
        // console.log('yeah hello i guess')

        // this.lineToAdd = currentLine

        // console.log('starting')

        // this.changesRangesHistoryArray.map((range, index) => {
        //   console.log(index + ': ' + range?.start.line)
        // })
        // console.log('ending')

        this.prevWorkingLine = currentLine
      }
    })

    vscode.window.onDidChangeTextEditorSelection((event) => {
      const currentLine = event.selections[0].start.line

      // console.log({ prev: this.prevWorkingLine })
      // console.log({ currentLine })
      // console.log(this.prevWorkingLine === currentLine)

      // if (this.lineToAdd > -1 && currentLine !== this.lineToAdd) {
      //   this.updateWorkingHistory(this.lineToAdd)
      // }

      // console.log('starting')
      // this.changesRangesHistoryArray.map((range, index) => {
      //   console.log(index + ': ' + range?.start.line)
      // })
      // console.log('ending')

      console.log(currentLine)

      console.log(this.changesRangesHistoryArray[0]?.start.line)

      console.log(currentLine === this.changesRangesHistoryArray[0]?.start.line)

      if (currentLine === this.changesRangesHistoryArray[0]?.start.line) {
        this.oldLenses = true
        return
      }
      this.oldLenses = false

      // if (
      //   this.prevSelectionLine === -1 ||
      //   this.prevSelectionLine === currentLine ||
      //   currentLine === this.changesRangesHistoryArray[0]?.start.line
      // ) {
      //   this.prevSelectionLine = currentLine
      //   return
      // }

      console.log('we came here')

      this.codeLensLine = currentLine
      this.showCodeLenses = false

      // console.log('starting')

      // this.changesRangesHistoryArray.map((range, index) => {
      //   console.log(index + ': ' + range?.start.line)
      // })
      // console.log('ending')

      this.codeLensLine = currentLine
      this.showCodeLenses = true

      // this.changesRangesHistoryArray.map((range, index) => {
      //   if (range?.contains(new vscode.Position(currentLine, 0))) {
      //     console.log('in range ' + index)

      //     this.codeLensLine = range.start.line
      //     this.showCodeLenses = true
      //   }
      // })

      this._onDidChangeCodeLenses.fire()

      this.prevSelectionLine = currentLine
    })
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    console.log('provider')

    if (this.oldLenses) {
      return this.codeLenses
    }

    if (this.showCodeLenses) {
      this.codeLenses = []

      let range = new vscode.Range(this.codeLensLine, 0, this.codeLensLine, 0)

      this.codeLenses.push(new vscode.CodeLens(range))

      return this.codeLenses
    }

    return []
  }

  public resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ) {
    console.log('resolver')

    codeLens.command = {
      title:
        'so much for the past 3 weeks lmao kill yourself, also you were working on ' +
        //@ts-ignore
        (this.changesRangesHistoryArray[0]?.start.line + 1),
      command: 'teleport.teleportToWormhole',
      arguments: [this.changesRangesHistoryArray[1]],
    }

    return codeLens
  }
}

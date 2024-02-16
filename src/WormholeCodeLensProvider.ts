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

    if (shouldIgnoreChange) {
      console.log('starting')

      this.changesRangesHistoryArray.map((range) => {
        console.log({ start: range?.start.line, end: range?.end.line })
      })

      console.log('ending')
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
      for (let i = this.changesRangesHistoryArray.length - 1; i > 0; i--) {
        this.changesRangesHistoryArray[i] =
          this.changesRangesHistoryArray[i - 1]
      }

      this.changesRangesHistoryArray[0] = newRange
    }

    console.log('starting')

    this.changesRangesHistoryArray.map((range) => {
      console.log({ start: range?.start.line, end: range?.end.line })
    })

    console.log('ending')

    // approach with only lines//
    // approach with only lines//
    // approach with only lines//
    // approach with only lines//
    // approach with only lines//
    // approach with only lines//

    // let shouldIgnoreChange = false

    // for (
    //   let i = currentLine;
    //   i < currentLine + this.linesFromFirstChange;
    //   i++
    // ) {
    //   if (this.workingLinesHistoryArray[0] === i) {
    //     shouldIgnoreChange = true
    //     break
    //   }
    // }

    // if (shouldIgnoreChange === false) {
    //   for (
    //     let i = currentLine;
    //     i > currentLine - this.linesFromFirstChange && i >= 0;
    //     i--
    //   ) {
    //     if (this.workingLinesHistoryArray[0] === i) {
    //       shouldIgnoreChange = true
    //       break
    //     }
    //   }
    // }

    // if (shouldIgnoreChange) {
    //   return
    // }

    // const inHistoryIndex = this.workingLinesHistoryArray.findIndex(
    //   (line) => line === currentLine
    // )

    // if (inHistoryIndex > -1) {
    //   this.workingLinesHistoryArray.splice(inHistoryIndex, 1)
    //   this.workingLinesHistoryArray.unshift(currentLine)
    // } else {
    //   for (let i = this.workingLinesHistoryArray.length - 1; i > 0; i--) {
    //     this.workingLinesHistoryArray[i] = this.workingLinesHistoryArray[i - 1]
    //   }

    //   this.workingLinesHistoryArray[0] = currentLine
    // }

    // // this.updateDecorations()
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
  private linesFromFirstChange = 3
  private codeLenses: vscode.CodeLens[] = []
  private workingLine: number = -1
  private workingLinesHistoryArray: number[] = []
  private changesRangesHistoryArray: (vscode.Range | undefined)[] = []
  private showCodeLenses = false
  private codeLensLine: number = 0
  private prevWorkingLine = -1

  private decorationsTest: vscode.TextEditorDecorationType[] = []
  private updateDecorations = () => {
    const editor = vscode.window.activeTextEditor

    this.decorationsTest.forEach((decoration) => {
      decoration.dispose()
    })

    this.workingLinesHistoryArray.map((line, index) => {
      if (line > -1) {
        const range = new vscode.Range(line, 0, line, 0)

        const opacity = 0.6 / (index + 1)

        const decoration = vscode.window.createTextEditorDecorationType({
          isWholeLine: true,
          backgroundColor: `rgba(153, 128, 250, ${opacity})`,
        })

        this.decorationsTest[index] = decoration

        editor?.setDecorations(decoration, [range])
      }
    })
  }

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

      // maybe i dont even need to debounce the function and infact only check if the lines are different
      if (this.prevWorkingLine > -1 && this.prevWorkingLine !== currentLine) {
        this.updateWorkingHistory(currentLine)
      } else {
        this.debouncedUpdateWorkingHistory(currentLine)
      }

      this.prevWorkingLine = currentLine
    })

    vscode.window.onDidChangeTextEditorSelection((event) => {
      const currentLine = event.selections[0].start.line

      this.codeLensLine = currentLine
      // this.showCodeLenses = true

      // this._onDidChangeCodeLenses.fire()
    })
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
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
    codeLens.command = {
      title:
        'so much for the past 3 weeks lmao kill yourself, also you were working on ' +
        (this.workingLinesHistoryArray[1] + 1),
      command: 'teleport.teleportToWormhole',
      arguments: [this.workingLinesHistoryArray[1]],
    }

    return codeLens
  }
}

import * as vscode from 'vscode'

// flow: store the line where there was a change and when a line is selected, navigate to that line. Add a delay when typing the new line or perhaps wait until the user navigates away and then remove the codelens. Starting with a simple approach to grouping changes

export class WormholeCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>()
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event

  private updateWorkingHistory = (currentLine: number) => {
    let shouldIgnoreChange = false

    // for (
    //   let i = currentLine;
    //   i < currentLine + this.linesFromFirstChange;
    //   i++
    // ) {
    //   // console.log(i)

    //   if (this.workingLinesHistoryArray.includes(i)) {
    //     shouldIgnoreChange = true
    //     break
    //   }
    // }

    // if (shouldIgnoreChange === false) {
    //   for (
    //     let i = currentLine;
    //     i < currentLine - this.linesFromFirstChange;
    //     i--
    //   ) {
    //     // console.log(i)

    //     if (this.workingLinesHistoryArray.includes(i)) {
    //       shouldIgnoreChange = true
    //       break
    //     }
    //   }
    // }

    // console.log(shouldIgnoreChange)

    const inHistoryIndex = this.workingLinesHistoryArray.findIndex(
      (line) => line === currentLine
    )

    if (inHistoryIndex > -1) {
      this.workingLinesHistoryArray.splice(inHistoryIndex, 1)
      this.workingLinesHistoryArray.unshift(currentLine)
    } else {
      for (let i = this.workingLinesHistoryArray.length - 1; i > 0; i--) {
        this.workingLinesHistoryArray[i] = this.workingLinesHistoryArray[i - 1]
      }

      this.workingLinesHistoryArray[0] = currentLine
    }

    this.updateDecorations()
  }

  private debouncingFunc = (cb: any, delay = 1000) => {
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
  private showCodeLenses = false
  private codeLensLine: number = 0
  private prevWorkingLine = -1

  private decorationsTest: vscode.TextEditorDecorationType[] = []
  private updateDecorations = () => {
    console.log('is this even being called?')

    const editor = vscode.window.activeTextEditor

    this.decorationsTest.forEach((decoration) => {
      decoration.dispose()
    })

    // console.log('on line 97')

    console.log(this.workingLinesHistoryArray)

    this.workingLinesHistoryArray.map((line, index) => {
      if (line > -1) {
        const range = new vscode.Range(line, 0, line, 0)

        const opacity = 1 / (index + 1)

        const decoration = vscode.window.createTextEditorDecorationType({
          isWholeLine: true,
          backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        })

        this.decorationsTest[index] = decoration

        editor?.setDecorations(decoration, [range])
      }
    })

    // program starts working properly if there is only 1 valid entry in the workingLines array or if all 4 entries are valid
    console.log('leaving update decorations')
  }

  constructor(wormholeCount = 4) {
    this.wormholeCount = wormholeCount
    for (let i = 0; i < wormholeCount; i++) {
      this.workingLinesHistoryArray[i] = -1
    }

    vscode.workspace.onDidChangeTextDocument((event) => {
      const currentLine = event.contentChanges[0].range.start.line

      if (this.prevWorkingLine > -1 && this.prevWorkingLine !== currentLine) {
        // console.log('is this being called?')
        this.updateWorkingHistory(currentLine)
      } else {
        this.debouncedUpdateWorkingHistory(currentLine)
      }

      // this code isnt being reached
      // console.log('current:   ' + currentLine)
      // console.log('prev:      ' + this.prevWorkingLine)

      this.prevWorkingLine = currentLine
    })

    vscode.window.onDidChangeTextEditorSelection((event) => {
      const currentLine = event.selections[0].start.line

      if (this.workingLine > -1 && currentLine !== this.workingLine) {
        this.codeLensLine = currentLine
        this.showCodeLenses = true
      } else {
        this.showCodeLenses = false
      }

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
        (this.workingLine + 1),
      command: 'teleport.teleportToWormhole',
      arguments: [this.workingLine],
    }

    return codeLens
  }
}

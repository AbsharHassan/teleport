import * as vscode from 'vscode'
import { HistoryEntry } from './types'
import { disappearingDecoration } from './utils/decoratorFunctions'

// flow: store the line where there was a change and when a line is selected, navigate to that line. Add a delay when typing the new line or perhaps wait until the user navigates away and then remove the codelens. Starting with a simple approach to grouping

export class WormholeCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses: vscode.EventEmitter<void> =
    new vscode.EventEmitter<void>()
  public readonly onDidChangeCodeLenses: vscode.Event<void> =
    this._onDidChangeCodeLenses.event

  private updateWorkingHistory = (currentLine: number) => {
    const newEntry: HistoryEntry = {
      range: new vscode.Range(
        // this is done to prevent -ve values for range start
        Math.max(currentLine - this.linesFromFirstChange, 0),
        0,
        currentLine + this.linesFromFirstChange,
        0
      ),
      workingLine: currentLine,
    }

    let shouldIgnoreChange = false

    // // for-loop chosen instead of .map() in order to incorporate break operator, since .intersetion() method may be costly
    // for (let i = 0; i < this.changesRangesHistoryArray.length; i++) {
    //   const intersects = this.changesRangesHistoryArray[i]?.intersection(
    //     newEntry
    //   )
    //     ? true
    //     : false
    //   if (intersects) {
    //     shouldIgnoreChange = true
    //     break
    //   }
    // }

    // only to check the recent most change
    if (this.changesRangesHistoryArray[0]?.range.intersection(newEntry.range)) {
      shouldIgnoreChange = true
      return
    }

    let inRangeHistoryIndex = -1

    // for-loop chosen instead of .map() in order to incorporate break operator, since .contains() method may be costly
    for (let i = 0; i < this.changesRangesHistoryArray.length; i++) {
      const contains = this.changesRangesHistoryArray[i]?.range.contains(
        newEntry.range
      )
      if (contains) {
        inRangeHistoryIndex = i
        break
      }
    }

    if (inRangeHistoryIndex > -1) {
      this.changesRangesHistoryArray.splice(inRangeHistoryIndex, 1)
      this.changesRangesHistoryArray.unshift(newEntry)
    } else {
      // remove the last history element and shift all positions to accomodate the new value
      for (let i = this.changesRangesHistoryArray.length - 1; i > 0; i--) {
        this.changesRangesHistoryArray[i] =
          this.changesRangesHistoryArray[i - 1]
      }

      this.changesRangesHistoryArray[0] = newEntry
    }
  }

  private logHistory = () => {
    console.log('starting')
    this.changesRangesHistoryArray.map((entry, clampedIndex) => {
      // console.log(clampedIndex + ': ' + entry?.range.start.line)
      console.log(
        clampedIndex +
          ': ' +
          entry?.workingLine +
          ', ' +
          entry?.workingCharacter
      )
    })
    console.log('ending')
  }

  /**
   * teleport
   */
  public teleport(direction: -1 | 1) {
    // set index to 1 if user was not inside history in order to go the recentmost history item
    console.log('in history?? :      ' + this.isBrowsingHistory)

    let clampedIndex = Math.min(
      Math.max(this.browsingIndex + direction, 0),
      this.wormholeCount - 1
    )

    console.log({ clampedIndex })

    if (clampedIndex + 1 > this.wormholeCount || clampedIndex < 0) {
      return
    }

    const editor = vscode.window.activeTextEditor

    if (editor) {
      const line = this.changesRangesHistoryArray[clampedIndex]?.workingLine
      const character =
        this.changesRangesHistoryArray[clampedIndex]?.workingCharacter ??
        Number.MAX_VALUE

      if (line === undefined || character === undefined) {
        return
      }

      const range = new vscode.Range(line, character, line, character)

      editor.selection = new vscode.Selection(range.start, range.end)
      editor.revealRange(range, vscode.TextEditorRevealType.InCenter)

      disappearingDecoration(editor, range)
    }
  }

  /**
   * toggleBrowsingHistory
   */
  public toggleBrowsingHistory(value: boolean) {
    this.isBrowsingHistory = value
  }

  private wormholeCount = 4
  private linesFromFirstChange = 0
  private codeLenses: vscode.CodeLens[] = []
  private workingLinesHistoryArray: number[] = []
  private changesRangesHistoryArray: (HistoryEntry | undefined)[] = []
  private showCodeLenses = false
  private codeLensLine: number = 0
  private prevWorkingLine = -1
  private isBrowsingHistory = false
  private browsingIndex = 0
  private characterToStore = 0
  private shownHistoryIndex = 0

  constructor(wormholeCount = 4) {
    this.wormholeCount = wormholeCount

    for (let i = 0; i < wormholeCount; i++) {
      this.workingLinesHistoryArray[i] = -1
    }

    for (let i = 0; i < wormholeCount; i++) {
      // this.changesRangesHistoryArray[i] = new vscode.Range(0, 0, 0, 0)
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

      this.isBrowsingHistory = false
      this.browsingIndex = 0

      // to check if user is navigating between the stored wormholes
      for (let i = 1; i < this.changesRangesHistoryArray.length; i++) {
        const entry = this.changesRangesHistoryArray[i]

        if (currentLine === entry?.range.start.line) {
          this.isBrowsingHistory = true
          this.browsingIndex = i
          break
        }
      }

      if (currentLine !== this.changesRangesHistoryArray[0]?.range.start.line) {
        if (this.changesRangesHistoryArray[0]) {
          this.changesRangesHistoryArray[0].workingCharacter =
            this.characterToStore
        }
      }

      this.codeLensLine = currentLine
      this.showCodeLenses = true

      this._onDidChangeCodeLenses.fire()

      if (!this.changesRangesHistoryArray[0]?.workingCharacter) {
        this.characterToStore = event.selections[0].active.character
      }
    })

    // vscode.window.onDidChangeTextEditorSelection((event) => {
    //   const currentLine = event.selections[0].start.line

    //   // to check if user is navigating between the stored wormholes
    //   for (let i = 1; i < this.changesRangesHistoryArray.length; i++) {
    //     const entry = this.changesRangesHistoryArray[i]

    //     if (currentLine === entry?.range.start.line) {
    //       this.isBrowsingHistory = true
    //       this.browsingIndex = i
    //       break
    //     } else {
    //       this.isBrowsingHistory = false
    //     }
    //   }

    //   if (!this.isBrowsingHistory) {
    //     // To make sure the codeLens doesnt change while the user is currently working in the recentmost range
    //     if (
    //       currentLine === this.changesRangesHistoryArray[0]?.range.start.line
    //     ) {
    //       this.browsingIndex = 1
    //     } else {
    //       // console.log('characterToStore:   ' + this.characterToStore)
    //       if (this.changesRangesHistoryArray[0]) {
    //         this.changesRangesHistoryArray[0].workingCharacter =
    //           this.characterToStore
    //       }

    //       this.browsingIndex = 0
    //     }
    //   } else {
    //     if (
    //       currentLine === this.changesRangesHistoryArray[0]?.range.start.line
    //     ) {
    //     } else {
    //       if (this.changesRangesHistoryArray[0]) {
    //         this.changesRangesHistoryArray[0].workingCharacter =
    //           this.characterToStore
    //       }
    //     }
    //   }

    //   this.codeLensLine = currentLine
    //   this.showCodeLenses = true

    //   this._onDidChangeCodeLenses.fire()

    //   if (!this.changesRangesHistoryArray[0]?.workingCharacter) {
    //     this.characterToStore = event.selections[0].active.character
    //   }
    // })
  }

  public provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): vscode.CodeLens[] | Thenable<vscode.CodeLens[]> {
    // console.log('provider')

    if (
      !this.showCodeLenses ||
      !this.changesRangesHistoryArray[this.browsingIndex]
    ) {
      return []
    }

    if (this.isBrowsingHistory) {
      this.codeLenses = []

      // check if the last (oldest) entry is selected or if the next entry is undefined
      if (
        this.browsingIndex + 1 >= this.wormholeCount ||
        !this.changesRangesHistoryArray[this.browsingIndex + 1]
      ) {
        let range = new vscode.Range(this.codeLensLine, 0, this.codeLensLine, 0)

        this.codeLenses.push(new vscode.CodeLens(range))

        return this.codeLenses
      }

      let rangeFirst = new vscode.Range(
        this.codeLensLine,
        0,
        this.codeLensLine,
        0
      )
      let rangeSecond = new vscode.Range(
        this.codeLensLine,
        1,
        this.codeLensLine,
        1
      )

      this.codeLenses.push(
        new vscode.CodeLens(rangeFirst),
        new vscode.CodeLens(rangeSecond)
      )

      return this.codeLenses
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
    // this.logHistory()

    if (!this.isBrowsingHistory) {
      const lineAtZero =
        this.changesRangesHistoryArray[0]?.range.start.line ?? NaN
      const lineAtOne =
        this.changesRangesHistoryArray[1]?.range.start.line ?? NaN

      const shownLine =
        lineAtZero !== this.codeLensLine ? lineAtZero : lineAtOne
      codeLens.command = {
        title: '(add hotkeys) You came from line: ' + (shownLine + 1),
        tooltip: 'Use this to navigate between your recent most changes',
        command: 'teleport.teleportToWormhole',
        arguments: [1],
      }
    } else {
      switch (codeLens.range.start.character) {
        case 0:
          const lineForward =
            this.changesRangesHistoryArray[this.browsingIndex - 1]?.range.start
              .line ?? NaN
          codeLens.command = {
            title: '(add hotkeys) Go forward to line: ' + (lineForward + 1),
            command: 'teleport.teleportToWormhole',
            arguments: [-1],
          }
          break
        case 1:
          const lineBackward =
            this.changesRangesHistoryArray[this.browsingIndex + 1]?.range.start
              .line ?? NaN
          codeLens.command = {
            title:
              `${
                this.browsingIndex > 0
                  ? '(add hotkeys) Go even further back to line: '
                  : '(add hotkeys) You came from line: '
              }` +
              (lineBackward + 1),
            command: 'teleport.teleportToWormhole',
            arguments: [1],
          }
          break
      }
    }

    return codeLens
  }
}

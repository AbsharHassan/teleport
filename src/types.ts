import { Range } from 'vscode'

export type HistoryEntry = {
  range: Range
  workingLine: number
  workingCharacter?: number
}

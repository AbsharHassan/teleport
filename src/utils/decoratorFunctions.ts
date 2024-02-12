import * as vscode from 'vscode'

export const disappearingDecoration = (
  editor: vscode.TextEditor,
  range: vscode.Range,
  timeToDisappear = 1000
): void => {
  const decoration = vscode.window.createTextEditorDecorationType({
    isWholeLine: true,
    backgroundColor: `rgba(100, 30, 255, 1.0)`,
  })

  editor.setDecorations(decoration, [range])

  setTimeout(() => {
    decoration?.dispose()
  }, timeToDisappear)
}

export const fadeOutDecoration = (
  editor: vscode.TextEditor,
  range: vscode.Range
): void => {
  let opacity = 0.5
  let decoration: vscode.TextEditorDecorationType

  const interval = setInterval((): void => {
    opacity -= 0.01

    if (opacity <= 0) {
      decoration?.dispose()
      clearInterval(interval)
    } else {
      console.log(opacity)

      decoration?.dispose()

      decoration = vscode.window.createTextEditorDecorationType({
        isWholeLine: true,
        backgroundColor: `rgba(100, 30, 255, ${opacity})`,
      })

      editor.setDecorations(decoration, [range])
    }
  }, 5)
}

export const blinkingDecoration = (
  editor: vscode.TextEditor,
  range: vscode.Range,
  blinkCount = 10,
  blinkGap = 1000
): void => {
  let count = blinkCount
  let decoration: vscode.TextEditorDecorationType

  const interval = setInterval((): void => {
    count--

    if (count <= 0) {
      decoration?.dispose()
      clearInterval(interval)
    } else {
      decoration?.dispose()

      if (count % 2 !== 0) {
        decoration = vscode.window.createTextEditorDecorationType({
          isWholeLine: true,
          backgroundColor: `rgba(100, 30, 255, 1.0)`,
        })

        editor.setDecorations(decoration, [range])
      }
    }
  }, blinkGap)
}

import { useEffect, useMemo, useState } from 'react'
import { DiffEditor } from '@monaco-editor/react'
import clsx from 'clsx'

type LanguageKey =
  | 'auto'
  | 'plaintext'
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'css'
  | 'html'
  | 'python'
  | 'go'
  | 'java'
  | 'csharp'
  | 'cpp'
  | 'rust'
  | 'yaml'
  | 'markdown'
  | 'bash'

export default function CodeDiffer() {
  const [leftName, setLeftName] = useState<string>('left.txt')
  const [rightName, setRightName] = useState<string>('right.txt')
  const [left, setLeft] = useState<string>('')
  const [right, setRight] = useState<string>('')
  const [sideBySide, setSideBySide] = useState<boolean>(true)
  const [ignoreWhitespace, setIgnoreWhitespace] = useState<boolean>(true)
  const [originalEditable, setOriginalEditable] = useState<boolean>(true)
  const [language, setLanguage] = useState<LanguageKey>('auto')
  const [isDark, setIsDark] = useState<boolean>(false)

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)')
    const update = () => setIsDark(mq?.matches ?? false)
    update()
    mq?.addEventListener?.('change', update)
    return () => mq?.removeEventListener?.('change', update)
  }, [])

  const [originalLanguage, modifiedLanguage] = useMemo(() => {
    if (language !== 'auto') return [language, language]
    return [inferLanguage(leftName, left), inferLanguage(rightName, right)]
  }, [language, leftName, rightName, left, right])

  function handleFileChange(which: 'left' | 'right', file?: File | null) {
    if (!file) return
    const setter = which === 'left' ? setLeft : setRight
    const nameSetter = which === 'left' ? setLeftName : setRightName
    nameSetter(file.name)
    file
      .text()
      .then((t) => setter(t))
      .catch(() => setter(''))
  }

  function swapSides() {
    setLeft(right)
    setRight(left)
    setLeftName(rightName)
    setRightName(leftName)
  }

  function clearBoth() {
    setLeft('')
    setRight('')
    setLeftName('left.txt')
    setRightName('right.txt')
  }

  return (
    <div className="space-y-6">
      <section aria-label="Inputs" className="space-y-3">
        <h2 className="text-lg font-medium">Code Diff</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border bg-white/70 dark:bg-white/5 border-slate-200 dark:border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{leftName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Original (left)</div>
              </div>
              <label className="px-2 py-1 rounded-md text-sm bg-slate-200 dark:bg-slate-800 cursor-pointer">
                Load file
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange('left', e.target.files?.[0])}
                />
              </label>
            </div>
            <textarea
              placeholder="Paste or type original content…"
              className="w-full h-28 rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 px-2 py-1 text-sm"
              value={left}
              onChange={(e) => setLeft(e.target.value)}
            />
          </div>
          <div className="rounded-lg border bg-white/70 dark:bg-white/5 border-slate-200 dark:border-slate-800 p-3 space-y-2">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{rightName}</div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Modified (right)</div>
              </div>
              <label className="px-2 py-1 rounded-md text-sm bg-slate-200 dark:bg-slate-800 cursor-pointer">
                Load file
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => handleFileChange('right', e.target.files?.[0])}
                />
              </label>
            </div>
            <textarea
              placeholder="Paste or type modified content…"
              className="w-full h-28 rounded-md bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 px-2 py-1 text-sm"
              value={right}
              onChange={(e) => setRight(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            className="px-3 py-2 rounded-md text-sm bg-slate-200 dark:bg-slate-800"
            onClick={swapSides}
          >
            Swap sides
          </button>
          <button
            className="px-3 py-2 rounded-md text-sm bg-slate-200 dark:bg-slate-800"
            onClick={clearBoth}
          >
            Clear
          </button>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={sideBySide}
              onChange={(e) => setSideBySide(e.target.checked)}
            />
            Side-by-side
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={ignoreWhitespace}
              onChange={(e) => setIgnoreWhitespace(e.target.checked)}
            />
            Ignore whitespace
          </label>
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={originalEditable}
              onChange={(e) => setOriginalEditable(e.target.checked)}
            />
            Edit left
          </label>
          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="text-sm">Language</span>
            <select
              className="text-sm px-2 py-1 rounded-md bg-white/80 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800"
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageKey)}
            >
              {languageOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <section aria-label="Diff">
        <div
          className={clsx(
            'rounded-lg border bg-white/70 dark:bg-white/5 border-slate-200 dark:border-slate-800 overflow-hidden'
          )}
          style={{ height: '70vh' }}
        >
          <DiffEditor
            theme={isDark ? 'vs-dark' : 'light'}
            original={left}
            modified={right}
            originalLanguage={originalLanguage}
            modifiedLanguage={modifiedLanguage}
            options={{
              renderSideBySide: sideBySide,
              ignoreTrimWhitespace: ignoreWhitespace,
              readOnly: false,
              originalEditable,
              automaticLayout: true,
              diffAlgorithm: 'advanced',
              scrollBeyondLastLine: false,
              renderIndicators: true,
              minimap: { enabled: true },
            }}
            onMount={(editor, monaco) => {
              // Keep editor and textareas in sync for bidirectional editing
              const modelOriginal = editor.getOriginalEditor().getModel()
              const modelModified = editor.getModifiedEditor().getModel()
              modelOriginal?.onDidChangeContent(() => setLeft(modelOriginal.getValue()))
              modelModified?.onDidChangeContent(() => setRight(modelModified.getValue()))
            }}
          />
        </div>
      </section>
    </div>
  )
}

const languageOptions: LanguageKey[] = [
  'auto',
  'plaintext',
  'javascript',
  'typescript',
  'json',
  'css',
  'html',
  'python',
  'go',
  'java',
  'csharp',
  'cpp',
  'rust',
  'yaml',
  'markdown',
  'bash',
]

function inferLanguage(name: string, content: string): LanguageKey {
  const ext = (name.split('.').pop() || '').toLowerCase()
  switch (ext) {
    case 'ts':
    case 'tsx':
      return 'typescript'
    case 'js':
    case 'jsx':
      return 'javascript'
    case 'json':
      return 'json'
    case 'css':
      return 'css'
    case 'html':
    case 'htm':
      return 'html'
    case 'py':
      return 'python'
    case 'go':
      return 'go'
    case 'java':
      return 'java'
    case 'cs':
      return 'csharp'
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'hpp':
    case 'hh':
    case 'hxx':
      return 'cpp'
    case 'rs':
      return 'rust'
    case 'yml':
    case 'yaml':
      return 'yaml'
    case 'md':
      return 'markdown'
    case 'sh':
    case 'bash':
      return 'bash'
    default:
      break
  }
  // Simple heuristics if no file extension
  if (/^{\s*[\{\[]/m.test(content)) return 'json'
  if (/^#\!.*\b(bash|sh)\b/.test(content)) return 'bash'
  if (/^\s*<(!doctype|html)\b/i.test(content)) return 'html'
  return 'plaintext'
}



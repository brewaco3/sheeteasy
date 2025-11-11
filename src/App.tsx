import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  NOTE_COLLECTIONS,
  NOTE_LETTERS,
  type Clef,
  type NoteDefinition,
  type NoteLetter,
} from './data/notes'

const KEY_BINDINGS = ['q', 'w', 'e', 'r'] as const
const CLEF_SYMBOLS: Record<Clef, string> = {
  treble: '\uD834\uDD1E',
  bass: '\uD834\uDD22',
}

interface AnswerOption {
  letter: NoteLetter
  label: string
}

interface Question {
  clef: Clef
  note: NoteDefinition
  options: AnswerOption[]
}

type MistakeRecord = {
  count: number
  lastMissedAt: number
}

type MistakeMap = Record<string, MistakeRecord>

const STORAGE_KEY = 'sheeteasy.mistakes'

const getClefName = (clef: Clef) => (clef === 'treble' ? '高音譜號' : '低音譜號')

const randomItem = <T,>(items: readonly T[]): T =>
  items[Math.floor(Math.random() * items.length)]

const shuffle = <T,>(items: readonly T[]): T[] =>
  [...items].sort(() => Math.random() - 0.5)

const buildOptionSet = (correct: NoteLetter): AnswerOption[] => {
  const incorrect = shuffle(
    NOTE_LETTERS.filter((letter) => letter !== correct),
  ).slice(0, 3)
  const combined = shuffle([correct, ...incorrect])
  return combined.map((letter) => ({ letter, label: letter }))
}

const buildQuestion = (
  clef: Clef,
  note: NoteDefinition,
): Question => ({
  clef,
  note,
  options: buildOptionSet(note.letter),
})

const getNoteKey = (clef: Clef, note: NoteDefinition) => `${clef}:${note.id}`

const loadMistakes = (): MistakeMap => {
  if (typeof window === 'undefined') {
    return {}
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as MistakeMap) : {}
  } catch (error) {
    console.error('Failed to load mistakes from storage', error)
    return {}
  }
}

const persistMistakes = (map: MistakeMap) => {
  if (typeof window === 'undefined') {
    return
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

const pickWeightedNote = (
  clef: Clef,
  mistakes: MistakeMap,
): NoteDefinition | null => {
  const collection = NOTE_COLLECTIONS[clef]
  const weighted: { note: NoteDefinition; weight: number }[] = []
  collection.forEach((note) => {
    const key = getNoteKey(clef, note)
    const mistake = mistakes[key]
    if (mistake?.count) {
      weighted.push({ note, weight: mistake.count })
    }
  })

  if (!weighted.length) {
    return null
  }

  const total = weighted.reduce((sum, entry) => sum + entry.weight, 0)
  let threshold = Math.random() * total
  for (const entry of weighted) {
    threshold -= entry.weight
    if (threshold <= 0) {
      return entry.note
    }
  }
  return weighted[weighted.length - 1]?.note ?? null
}

const STAFF_LINE_SPACING = 16
const STAFF_TOP_PADDING = 28
const LEDGER_LENGTH = 60

function App() {
  const [mode, setMode] = useState<'all' | 'mistakes'>('all')
  const [question, setQuestion] = useState<Question | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [feedback, setFeedback] = useState<
    | { type: 'correct'; message: string }
    | { type: 'incorrect'; message: string; correctLetter: NoteLetter }
    | null
  >(null)
  const [stats, setStats] = useState({ total: 0, correct: 0 })
  const [mistakes, setMistakes] = useState<MistakeMap>({})
  const [isRevealing, setIsRevealing] = useState(false)
  const questionRef = useRef<Question | null>(null)

  useEffect(() => {
    setMistakes(loadMistakes())
  }, [])

  useEffect(() => {
    persistMistakes(mistakes)
  }, [mistakes])

  useEffect(() => {
    questionRef.current = question
  }, [question])

  const availableMistakes = useMemo(() =>
    Object.entries(mistakes).filter(([, entry]) => entry.count > 0),
  [mistakes])

  const effectiveMode =
    mode === 'mistakes' && availableMistakes.length === 0 ? 'all' : mode

  const prepareQuestion = useCallback(
    (nextMode: 'all' | 'mistakes' = effectiveMode) => {
      const current = questionRef.current
      let candidate: Question | null = null
      let attempts = 0

      while (attempts < 6) {
        const clef = randomItem(['treble', 'bass'] as const)
        let note: NoteDefinition | null = null

        if (nextMode === 'mistakes') {
          note = pickWeightedNote(clef, mistakes)
        }

        if (!note) {
          note = randomItem(NOTE_COLLECTIONS[clef])
        }

        const possible = buildQuestion(clef, note)
        candidate = possible
        attempts += 1

        if (
          !current ||
          current.clef !== possible.clef ||
          current.note.id !== possible.note.id ||
          attempts >= 5
        ) {
          break
        }
      }

      if (candidate) {
        setQuestion(candidate)
        questionRef.current = candidate
        setSelectedIndex(null)
        setFeedback(null)
        setIsRevealing(false)
      }
    },
    [effectiveMode, mistakes],
  )

  useEffect(() => {
    prepareQuestion('all')
  }, [prepareQuestion])

  useEffect(() => {
    if (mode === 'mistakes' && availableMistakes.length === 0) {
      setMode('all')
    }
  }, [mode, availableMistakes])

  const handleSelect = useCallback((index: number) => {
    if (question && !isRevealing) {
      setSelectedIndex(index)
    }
  }, [question, isRevealing])

  const handleSubmit = useCallback(() => {
    if (!question || selectedIndex === null || isRevealing) {
      return
    }
    const selectedOption = question.options[selectedIndex]
    const isCorrect = selectedOption.letter === question.note.letter

    setStats((prev) => ({
      total: prev.total + 1,
      correct: prev.correct + (isCorrect ? 1 : 0),
    }))

    if (isCorrect) {
      setFeedback({
        type: 'correct',
        message: `${selectedOption.letter} ✅`,
      })
      const key = getNoteKey(question.clef, question.note)
      if (mistakes[key]?.count) {
        setMistakes((prev) => {
          const next = { ...prev }
          const entry = next[key]
          if (entry) {
            const nextCount = entry.count - 1
            if (nextCount <= 0) {
              delete next[key]
            } else {
              next[key] = { ...entry, count: nextCount }
            }
          }
          return next
        })
      }
    } else {
      const key = getNoteKey(question.clef, question.note)
      setFeedback({
        type: 'incorrect',
        correctLetter: question.note.letter,
        message: `正確答案是 ${question.note.letter}${question.note.octave}`,
      })
      setMistakes((prev) => ({
        ...prev,
        [key]: {
          count: (prev[key]?.count ?? 0) + 1,
          lastMissedAt: Date.now(),
        },
      }))
    }

    setIsRevealing(true)

    setTimeout(() => {
      prepareQuestion()
    }, 900)
  }, [isRevealing, mistakes, prepareQuestion, question, selectedIndex])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!question) return
      const key = event.key.toLowerCase()
      const optionIndex = KEY_BINDINGS.indexOf(key as (typeof KEY_BINDINGS)[number])
      if (optionIndex >= 0) {
        event.preventDefault()
        handleSelect(optionIndex)
      } else if (key === ' ') {
        event.preventDefault()
        handleSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleSelect, handleSubmit, question])

  const accuracy = stats.total
    ? Math.round((stats.correct / stats.total) * 100)
    : null

  return (
    <div className="App">
      <header className="app-header">
        <h1>SheetEasy Drill</h1>
        <p className="subtitle">快速辨認高音與低音譜號上的音符</p>
      </header>

      <section className="controls">
        <div className="mode-toggle">
          <label>
            <input
              type="radio"
              name="mode"
              value="all"
              checked={mode === 'all'}
              onChange={() => {
                setMode('all')
                prepareQuestion('all')
              }}
            />
            一般練習
          </label>
          <label className="mistake-option">
            <input
              type="radio"
              name="mode"
              value="mistakes"
              checked={mode === 'mistakes'}
              disabled={availableMistakes.length === 0}
              onChange={() => {
                setMode('mistakes')
                prepareQuestion('mistakes')
              }}
            />
            錯題練習
            {availableMistakes.length === 0 && (
              <span className="hint"> (尚未記錄)</span>
            )}
          </label>
        </div>
        <div className="stats">
          <span>總題數: {stats.total}</span>
          <span>答對: {stats.correct}</span>
          <span>正確率: {accuracy !== null ? `${accuracy}%` : '--'}</span>
        </div>
      </section>

      {question && (
        <main className="quiz-area">
          <div className="staff-container">
            <svg
              viewBox="0 0 220 160"
              role="img"
              aria-label={`${getClefName(question.clef)}上的音符 ${question.note.letter}${question.note.octave}`}
            >
              {[...Array(5)].map((_, index) => {
                const y = STAFF_TOP_PADDING + index * STAFF_LINE_SPACING
                return <line key={index} x1={20} x2={200} y1={y} y2={y} />
              })}

              <text className={`clef clef-${question.clef}`} x={42} y={100}>
                {CLEF_SYMBOLS[question.clef]}
              </text>

              {renderLedgerLines(question.note.stepsFromTop)}

              <ellipse
                className="note-head"
                cx={140}
                cy={STAFF_TOP_PADDING + question.note.stepsFromTop * (STAFF_LINE_SPACING / 2)}
                rx={12}
                ry={8}
              />
              <line
                className="note-stem"
                x1={148}
                x2={148}
                y1={
                  STAFF_TOP_PADDING +
                  question.note.stepsFromTop * (STAFF_LINE_SPACING / 2) -
                  (question.note.stepsFromTop <= 4 ? 28 : -28)
                }
                y2={
                  STAFF_TOP_PADDING +
                  question.note.stepsFromTop * (STAFF_LINE_SPACING / 2)
                }
              />
            </svg>
          </div>

          <div className="answer-grid">
            {question.options.map((option, index) => {
              const keyHint = KEY_BINDINGS[index]?.toUpperCase()
              const isSelected = selectedIndex === index
              const isCorrect = option.letter === question.note.letter
              const shouldHighlightCorrect =
                isRevealing && feedback?.type === 'incorrect' && isCorrect

              return (
                <button
                  key={option.letter + index}
                  className={`answer-button${
                    isSelected ? ' selected' : ''
                  }${shouldHighlightCorrect ? ' highlight' : ''}`}
                  onClick={() => handleSelect(index)}
                >
                  <span className="key-hint">{keyHint}</span>
                  <span className="answer-label">{option.label}</span>
                </button>
              )
            })}
          </div>

          <div className="instructions">
            <p>
              使用 <strong>Q / W / E / R</strong> 選擇答案，按下 <strong>空白鍵</strong>{' '}
              提交並前往下一題。
            </p>
          </div>

          {feedback && (
            <div className={`feedback ${feedback.type}`}>
              <span>{feedback.message}</span>
            </div>
          )}
        </main>
      )}
    </div>
  )
}

const renderLedgerLines = (stepsFromTop: number) => {
  const lines: number[] = []
  if (stepsFromTop < 0) {
    for (let line = -1; line >= Math.ceil(stepsFromTop); line--) {
      lines.push(line)
    }
  }
  if (stepsFromTop > 4) {
    for (let line = 5; line <= Math.ceil(stepsFromTop); line++) {
      lines.push(line)
    }
  }

  return lines.map((line, index) => {
    const y = STAFF_TOP_PADDING + line * (STAFF_LINE_SPACING / 2)
    return <line key={`ledger-${line}-${index}`} x1={120} x2={120 + LEDGER_LENGTH} y1={y} y2={y} />
  })
}

export default App

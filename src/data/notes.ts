export type Clef = 'treble' | 'bass'

export type NoteLetter = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export interface NoteDefinition {
  id: string
  letter: NoteLetter
  octave: number
  /**
   * Number of half steps (line/space) below the top staff line.
   * 0 corresponds to the top line. Positive values move downward.
   */
  stepsFromTop: number
}

const createNote = (
  letter: NoteLetter,
  octave: number,
  stepsFromTop: number,
): NoteDefinition => ({
  id: `${letter}${octave}`,
  letter,
  octave,
  stepsFromTop,
})

export const TREBLE_NOTES: NoteDefinition[] = [
  createNote('A', 5, -1),
  createNote('G', 5, -0.5),
  createNote('F', 5, 0),
  createNote('E', 5, 0.5),
  createNote('D', 5, 1),
  createNote('C', 5, 1.5),
  createNote('B', 4, 2),
  createNote('A', 4, 2.5),
  createNote('G', 4, 3),
  createNote('F', 4, 3.5),
  createNote('E', 4, 4),
  createNote('D', 4, 4.5),
  createNote('C', 4, 5),
  createNote('B', 3, 5.5),
  createNote('A', 3, 6),
]

export const BASS_NOTES: NoteDefinition[] = [
  createNote('C', 4, -1),
  createNote('B', 3, -0.5),
  createNote('A', 3, 0),
  createNote('G', 3, 0.5),
  createNote('F', 3, 1),
  createNote('E', 3, 1.5),
  createNote('D', 3, 2),
  createNote('C', 3, 2.5),
  createNote('B', 2, 3),
  createNote('A', 2, 3.5),
  createNote('G', 2, 4),
  createNote('F', 2, 4.5),
  createNote('E', 2, 5),
  createNote('D', 2, 5.5),
  createNote('C', 2, 6),
]

export const NOTE_COLLECTIONS: Record<Clef, NoteDefinition[]> = {
  treble: TREBLE_NOTES,
  bass: BASS_NOTES,
}

export const NOTE_LETTERS: NoteLetter[] = ['A', 'B', 'C', 'D', 'E', 'F', 'G']

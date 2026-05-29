import Dexie, { type Table } from 'dexie';

export interface Word {
  id?: number;
  word: string;
  pos: string;
  translation: string;
  example: string;
  exampleTranslation: string;
  level: string; // 'easy', 'medium', 'hard'
  addedAt: Date;
  lastReviewedAt?: Date;
  correctCount: number;
  incorrectCount: number;
  isFavorite: boolean;
  source?: string; // PDFファイル名
}

export interface StudySession {
  id?: number;
  date: Date;
  durationMinutes: number;
  correctAnswers: number;
  totalQuestions: number;
  topic: string;
}

export class LingoAIDB extends Dexie {
  words!: Table<Word, number>;
  sessions!: Table<StudySession, number>;

  constructor() {
    super('LingoAIDB');
    this.version(1).stores({
      words: '++id, &word, addedAt, lastReviewedAt, isFavorite, level',
      sessions: '++id, date, topic'
    });
    // v2: sourceフィールド追加、wordのユニーク制約を外す
    this.version(2).stores({
      words: '++id, word, addedAt, lastReviewedAt, isFavorite, level, source',
      sessions: '++id, date, topic'
    });
  }
}

export const db = new LingoAIDB();

// FIX: Removed circular self-import of `PracticeLevel` which caused a declaration conflict.
export enum PracticeLevel {
  Phonemes = 'phonemes',
  Words = 'words',
  Phrases = 'phrases',
  Sentences = 'sentences',
}

export interface PracticeItem {
  text: string;
  ipa: string;
  exampleWord?: string; // Word for AI scoring context, especially for phonemes
  refAudioUrl?: string; // Optional reference audio URL
  speakableText?: string; // Pre-computed text for TTS to pronounce phonemes
}

// --- NEW Xunfei Evaluation Result Types ---

export interface PhonemeScore {
  span: { end: number; start: number };
  tone_index: string;
  phone: string;
  pronunciation: number;
  phoneme: string;
}

export interface WordScore {
  span: { end: number; start: number };
  charType: number;
  word: string;
  phonemes: PhonemeScore[];
  pinyin: string;
  tone: string;
  readType: number; // 0: normal, 1: insert before, 2: miss, 3: repeat, 4: misread
  pause: { duration: number; type: number };
  scores: {
    tone: number;
    pronunciation: number;
    prominence: number;
    overall: number;
  };
}

// This is the new main result type returned by our backend service.
export interface EvaluationResult {
  overall: number;
  integrity: number;
  fluency: number;
  pronunciation: number;
  words: WordScore[];
  speed: number;
}

// The old ScoreResult is deprecated and replaced by EvaluationResult
export type ScoreResult = EvaluationResult;

// FIX: Added back the User interface, which is still used by authService and LoginPage.
export interface User {
  identifier: string;
}

// New types for structured phoneme data
export interface PhonemeCategory {
  title: string;
  items: PracticeItem[];
}

export interface PhonemeSuperCategory {
  title: string;
  categories: PhonemeCategory[];
}

export type PracticeData = {
  [PracticeLevel.Phonemes]: PhonemeSuperCategory[];
  [PracticeLevel.Words]: PracticeItem[];
  [PracticeLevel.Phrases]: PracticeItem[];
  [PracticeLevel.Sentences]: PracticeItem[];
};


// --- NEW Types for Backend Proxy Requests ---
export interface EvaluationRequestBody {
  audioBase64: string;
  audioMimeType: string;
  referenceText: string;
}

export interface TtsRequestBody {
  text: string;
}
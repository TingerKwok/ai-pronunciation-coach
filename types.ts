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

export interface ScoreResult {
  score: number;
  feedback: string;
}

// Fix: Define the User interface, which was removed from App.tsx but is still required by other components.
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
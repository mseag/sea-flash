import * as img from './img.js';

// Part of speech enumeration
export enum PoS {
  I,
  II,
  III
}

export const longGloss = 80; // Character length to put in "longer" flashcards

// Object to hold image defaults
export interface configImageType
{
  directory: string;            // Path to images folder
  defaultSize: [number, number] // Default pixel size (width, height)
}

// Object to hold program configuration
export interface configFileType
{
  lwc: string;      // Language in wordlist to use for LWC
  wordlist: string; // Path to wordlist
  images: configImageType;

  // Optional parameters
  startUID?: number; // Generating flashcards starting with this UID in the wordlist
  endUID?: number;   // The last UID in the wordlist to generate flashcard
}

// Object to hold flashcard info
export interface configType {
  uid: number;
  pos: PoS;

  english: string; // Word(s) in English
  lwc:     string; // Word(s) in lwc

  ipa: string; // Word in IPA

  img?: img.imgType;
}

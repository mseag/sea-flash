// Copyright 2024 SIL Global
import * as img from './img.js';
import * as fs from 'fs';

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

  cardsPerAccordion?: number; // Number of flashcards per accordion group. Default to 250
}

// Object to hold flashcard info
export interface configType {
  uid?: number;
  pos: PoS;

  english: string; // Word(s) in English
  lwc:     string; // Word(s) in lwc

  ipa: string; // Word in IPA

  img?: img.imgType;
}

export function validateFile(configFile) {
  // Validate config file
  if (!configFile.lwc) {
    console.error(`config file missing language name for "lwc":`);
    process.exit(1);
  }

  if (!configFile.wordlist) {
    console.error(`config file missing wordlist tsv path "wordlist":`);
    process.exit(1);
  }
  if (!fs.existsSync(configFile.wordlist)) {
    console.error(`Can't open wordlist.tsv ${configFile.wordlist}`);
    process.exit(1);
  }

  if (!configFile.images || !configFile.images.directory) {
    console.error(`config file missing images path "directory":`);
    process.exit(1);
  }
  if (!fs.existsSync(configFile.images.directory)) {
    console.error(`Can't open images folder ${configFile.images.directory}`);
    process.exit(1);
  }
  if (!configFile.images.defaultSize || configFile.images.defaultSize.length != 2) {
    console.error(`config file missing image "defaultSize": [width, height] in pixels`);
    process.exit(1);
  }

  if (configFile.startUID && configFile.endUID && configFile.startUID > configFile.endUID) {
    console.error(`config file has invalid range: startUID ${configFile.startUID} > endUID ${configFile.endUID}`);
    process.exit(1);
  }

  if (configFile.cardsPerAccordion && configFile.cardsPerAccordion > configFile.endUID) {
    console.error(`config file has invalid cardsPerAccordion: ${configFile.cardsPerAccordion} > endUID ${configFile.endUID}`);
    process.exit(1);
  }
}

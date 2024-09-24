
// Part of speech enumeration
export enum PoS {
  noun,
  verb
}

export interface imgType {
  id : number; // ID number corresponding to word
  path : string;
  x : number; // Horizontal pixel size
  y : number; // Vertical pixel size
}

export interface lwcType {
  languageID: string; // BCP-47 language ID of the LWC
  gloss: string;

  // Optional font information
  fontPath?: string;
  fontSize?: number;
}

export interface configType {
  id: number;
  english: string; // Word in English
  pos: PoS;
  lwc: lwcType;
  ipa: string;

  img?: imgType;
}

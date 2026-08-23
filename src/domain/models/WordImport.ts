export interface WordImportPair {
  ua: string;
  pl: string;
}

export interface WordImportEntry {
  topic: string;
  words: WordImportPair | WordImportPair[];
}

export interface WordImportResult {
  added: number;
  skippedDuplicates: number;
  errors: string[];
}

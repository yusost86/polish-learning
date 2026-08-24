export interface Word {
  id: string;
  term: string;
  translation: string;
  topicId: string;
  /** Polish sentence with `______` where the target word belongs. */
  contextSentence?: string;
}

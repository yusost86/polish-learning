export enum WordState {
  /**
   *flashcard "foreign - native" варіанти "Знайомий", "Ще раз"
   * "Знайомий" - перехід Learning
   * "Ще раз" - залишити як є
   */
  New = "NEW",
  /**
   * до 2 послідовні успіхів - multiple choice =>  foreign - вибір правильного варіанту з  native декількох запропонованих 
   * до 2 послідовні успіхів - multiple choice =>  native - вибір правильного варіанту з  foreign декількох запропонованих 
   * 4 послідовних успіха - перехід LEARNING
   */
  Learning = "LEARNING",
  /**
   * до 2 послідовних успіхів - native words => put missing letters in gaps
   * до 2 послідовних успіхів - native words => put letters in correct order
   * 4 послідовних успіха - перехід Mature
   */
  Consolidating = "CONSOLIDATING",

  /**
   * до 2 полслідовних успіхів - native words => input full word
   * * 2 послідовних успіха - перехід RELEARNING
   */
  Mature = "MATURE",
  /**
   * native words => put letters in correct order
   * native words => put missing letters in gaps
   * native words => input full word
   */
  Relearning = "RELEARNING",
}

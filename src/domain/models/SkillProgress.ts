export interface SkillProgress {
  mastery: number;
  correct: number;
  attempts: number;
}

export function createEmptySkillProgress(): SkillProgress {
  return { mastery: 0, correct: 0, attempts: 0 };
}

import { getCachedWords } from "../data/catalogProvider";
import { LearningWordModel } from "../domain/models/LearningWordModel";
import { getLearningWordForLessonByState } from "./ReviewQueueBuilder";
import {
  normalizeGetNextTasksInput,
  type GetNextTasksParams,
} from "./sessionQueueTypes";
import { LessonModel } from "../domain/models/LessonModel";
import type { ILearningWordRepository } from "../repositories/ILearningWordRepository";

export class LearningEngine {
  constructor(
    private readonly learningWordRepository: ILearningWordRepository,
  ) { }

  async getLesson(input?: GetNextTasksParams): Promise<LessonModel> {
    const { topicId } = normalizeGetNextTasksInput(input);

    const learningWords = topicId
      ? await this.learningWordRepository.getLearningWordsByTopic(topicId)
      : await this.learningWordRepository.getLearningWords();

    const lessonWords = getLearningWordForLessonByState(learningWords);
    const allWords = getCachedWords();
    const wordsById = new Map(allWords.map((word) => [word.id, word]));

    const lessonWordModels: LearningWordModel[] = [];
    for (const learningWord of lessonWords) {
      const word = wordsById.get(learningWord.wordId);
      if (!word) {
        continue;
      }

      const getWordPool = () => allWords.filter((candidate) => candidate.topicId === word.topicId);
      lessonWordModels.push(new LearningWordModel(learningWord, word, getWordPool));
    }

    return new LessonModel(lessonWordModels);
  }

  async submitAnswer(learningWord: LearningWordModel): Promise<void> {
    await this.learningWordRepository.save(learningWord.LearningWord);
  }
}

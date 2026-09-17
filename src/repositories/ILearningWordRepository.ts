import { LearningWord } from "../domain/models/LearningWordModel";


export interface ILearningWordRepository {
  getLearningWordsByTopic(topicId: string): Promise<LearningWord[]>;
  save(learningWord: LearningWord): Promise<void>;
  getLearningWords(): Promise<LearningWord[]>;
}

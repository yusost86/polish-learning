import { selectExerciseType } from "../../services/ExerciseSelector";
import { shuffled, uniqueDistractors } from "../../services/MultipleChoiceExerciseBuilder";
import { ExerciseType } from "../enums/ExerciseType";
import { LearningWordModel } from "./LearningWordModel";
import { Word } from "./Word";

export class ExerciseModel {
    public readonly prompt: string;
    public readonly label: string;
    public correctAnswer: string;
    private readonly labelOf: (word: Word) => string;
    constructor(
        public readonly exerciseType: ExerciseType,
        public readonly word: Word,
        public readonly LearningWord: LearningWordModel,
    ) {
        switch (this.exerciseType) {
            case ExerciseType.Flashcard:
                this.labelOf = (word: Word) => word.translation;
                this.prompt = this.word.term;
                this.correctAnswer = this.word.term;
                break;
            case ExerciseType.NativeMultipleChoice:
                this.labelOf = (word: Word) => word.translation;
                this.prompt = this.word.term;
                this.correctAnswer = this.word.translation;
                break;
            case ExerciseType.ForeignMultipleChoice:
                this.labelOf = (word: Word) => word.term;
                this.prompt = this.word.translation;
                this.correctAnswer = this.word.term;
                break;
            default:
                this.labelOf = (word: Word) => word.term;
                this.prompt = this.word.translation;
                this.correctAnswer = this.word.term;
                break;
        }

        this.label = this.labelOf(this.word);
    }
    getPossibleAnswers(): string[] {
        const distractors = uniqueDistractors(this.word, this.LearningWord.getWordPool(), 3, this.labelOf);

        const choices = shuffled([
            this.labelOf(this.word),
            ...distractors.map((distractor) => this.labelOf(distractor)),
        ]);

        return choices;
    }
    public answer(answer: string): boolean {
        const isCorrect = answer?.trim().toLowerCase() === this.correctAnswer.trim().toLowerCase();

        this.LearningWord.addHistoryExerciseEntry(isCorrect, this.exerciseType);

        return isCorrect;
    }
}

export class LessonModel {

    private readonly initialExersiceQueue: ExerciseModel[];

    constructor(private readonly learningWords: LearningWordModel[]) {
        if (this.learningWords.length > 10) {
            throw new Error("Too many learning words");
        }

        this.initialExersiceQueue = [];
        for (const learningWord of this.learningWords) {

            this.initialExersiceQueue.push(new ExerciseModel(
                selectExerciseType(learningWord.LearningWord),
                learningWord.word,
                learningWord
            ));
        }
    }
    public GetExercises() {
       return this.initialExersiceQueue;
    }

}
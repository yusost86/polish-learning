import { useMemo } from 'react';
import type { ExerciseType, LearningExerciseType, StudentWord, Word } from '../domain/types';
import { selectExercise } from '../features/learning/exercises/exerciseSelector';
import { toLearningWord, useLearningSession } from '../hooks/useLearningSession';
import { maskWord } from '../learning/exercise-plan';
import { BackButton } from './components/BackButton';
import { Centered } from './components/Centered';
import DifficultyBadge from './components/DifficultyBadge';
import { MultipleChoiceExercise } from './components/MultipleChoiceExercise';
import TypeInExercise from './components/TypeInExercise';
import { GameSessionModel, InteractionKind } from './GameScreen';
import { toLearningStats } from '../learning/session';


const gmSDefaultState: GameSessionModel = {
  direction: "FOREIGN_TO_NATIVE" as ExerciseType,
  kind: "MULTIPLE_CHOICE" as InteractionKind,
  blanks: 0 as number,
  learningExerciseType: 'recognition' as LearningExerciseType
}

export function GameSession({
  initialCards, wordsMap, distractorPool, aheadOfSchedule, onBackToMenu,
}: {
  initialCards: StudentWord[];
  wordsMap: Record<string, Word>;
  distractorPool: Word[];
  aheadOfSchedule: boolean;
  onBackToMenu: () => void;
}) {
  const { currentCard, answer, stats, isFinished } = useLearningSession(initialCards);

  const currentWord = useMemo(() => currentCard ? wordsMap[currentCard.wordId] : undefined, [currentCard, wordsMap]);

  const gameState: GameSessionModel = useMemo(() => {
    const gmState: GameSessionModel = { ...gmSDefaultState };

    if (!currentCard || !currentWord) return gmState;

    const canDoMultipleChoice = currentWord.exerciseTypes.includes('MULTIPLE_CHOICE') && distractorPool.length >= 4;
    const exercise = selectExercise(toLearningWord(currentWord), toLearningStats(currentCard, currentWord));

    gmState.learningExerciseType = exercise.type;

    switch (exercise.variant) {
      case 'multiple-choice':
        gmState.direction = 'FOREIGN_TO_NATIVE';
        gmState.kind = canDoMultipleChoice ? 'MULTIPLE_CHOICE' : 'TYPE_IN';
        gmState.blanks = 0;
        break;
      case 'reverse-multiple-choice':
        gmState.direction = 'NATIVE_TO_FOREIGN';
        gmState.kind = canDoMultipleChoice ? 'MULTIPLE_CHOICE' : 'TYPE_IN';
        gmState.blanks = 0;
        break;
      case 'sentence-completion':
        gmState.direction = 'NATIVE_TO_FOREIGN';
        gmState.kind = 'FILL_BLANK';
        gmState.blanks = Math.max(1, Math.ceil(currentWord.nativeText.length / 5));
        break;
      case 'translation':
      case 'mixed-recall':
      case 'typing':
        gmState.direction = 'NATIVE_TO_FOREIGN';
        gmState.kind = 'TYPE_IN';
        gmState.blanks = 0;
        break;
    }
    return gmState;
  }, [currentCard, currentWord, distractorPool.length]);

  const { blanks, direction, kind, learningExerciseType } = gameState;

  const frontText = currentWord ? (direction === 'FOREIGN_TO_NATIVE' ? currentWord.foreignText : currentWord.nativeText) : '';
  const backText = currentWord ? (direction === 'FOREIGN_TO_NATIVE' ? currentWord.nativeText : currentWord.foreignText) : '';
  const frontLabel = direction === 'FOREIGN_TO_NATIVE' ? 'PL' : 'UK';
  const edgeColor = direction === 'FOREIGN_TO_NATIVE' ? 'var(--gold)' : 'var(--blue)';

  const maskedHint = useMemo(() => {
    if (kind !== 'FILL_BLANK' || !backText) return undefined;
    return maskWord(backText, blanks);
  }, [kind, backText, blanks]);

  const progressPct = useMemo(() => {
    if (stats.total === 0) return 0;
    return Math.round((stats.answered / stats.total) * 100);
  }, [stats]);


  const handleChoice = (isCorrect: boolean) => {
    if (!currentWord) return;

    answer({
      word: currentWord,
      learningExerciseType,
      exerciseType: direction,
      isCorrect: isCorrect,
    });
  }

  if (isFinished || !currentCard || !currentWord) {
    return (
      <Centered>
        <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
        <h2 style={{ marginBottom: 6 }}>Сесію завершено</h2>
        <div style={{ color: 'var(--text-dim)', marginBottom: 20, textAlign: 'center' }}>
          Відповідей: <span className="mono">{stats.answered}</span> · Правильно:{' '}
          <span className="mono">{stats.correct}</span>
        </div>
        <BackButton onClick={onBackToMenu} />
      </Centered>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBackToMenu}
          aria-label="Назад"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 999, width: 38, height: 38, color: 'var(--text)', fontSize: 16 }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ height: 6, background: 'var(--surface-alt)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progressPct}%`, background: 'var(--gold)', transition: 'width .3s ease' }} />
          </div>
        </div>
        <div className="mono" style={{ fontSize: 13, color: 'var(--text-faint)', minWidth: 36, textAlign: 'right' }}>
          {stats.answered}/{stats.total}
        </div>
      </header>

      {aheadOfSchedule && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-dim)',
            background: 'var(--surface-alt)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-s)',
            padding: '8px 12px',
          }}
        >
          ⏱ Нових слів і прострочених повторень поки немає — ось найближчі слова наперед графіка.
        </div>
      )}

      <DifficultyBadge kind={kind} card={currentCard} />

      {kind === 'MULTIPLE_CHOICE' ? (
        <MultipleChoiceExercise
          key={currentWord.id}
          promptLabel={frontLabel}
          promptText={frontText}
          edgeColor={edgeColor}
          correctText={backText}
          onSubmit={handleChoice}
          currentWord={currentWord}
          direction={direction}
          distractorPool={distractorPool}
        />
      ) : (
        <TypeInExercise
          key={currentCard.id}
          promptLabel={frontLabel}
          promptText={frontText}
          edgeColor={edgeColor}
          maskedHint={maskedHint}
          correctText={backText}
          onSubmit={handleChoice}
        />
      )}
    </div>
  )
}

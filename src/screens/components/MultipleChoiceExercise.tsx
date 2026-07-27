import { useMemo, useState } from 'react';
import { normalizeAnswer } from '../../learning/exercise-plan';
import { PromptCard } from './PromptCard';
import { ExerciseType, Word } from '../../domain/types';
import { shuffled } from '../GameScreen';

interface MultipleChoiceExerciseProps {
  promptLabel: string;
  promptText: string;
  edgeColor: string;
  correctText: string;
  onSubmit: (isCorrect: boolean) => void;

  currentWord: Word,
  distractorPool:Array<Word>
  direction:ExerciseType
}
export function MultipleChoiceExercise({
  promptLabel, promptText, edgeColor, correctText, onSubmit, currentWord, distractorPool, direction
}: MultipleChoiceExerciseProps) {

  const [answer, setAnswer] = useState<string | null>(null);

  const handleSubmit = () => {
    setAnswer("");
    const isCorrect = normalizeAnswer(answer || '') === normalizeAnswer(correctText);
    onSubmit(isCorrect);
  }

  const selected = Boolean(answer);

  const options = useMemo(() => {
    if (!currentWord) return [];

    const getAnswerText = (w: Word) => (direction === 'FOREIGN_TO_NATIVE' ? w.nativeText : w.foreignText);
    const correctText = getAnswerText(currentWord);

    const others = distractorPool.filter((w) => w.id !== currentWord.id && getAnswerText(w) !== correctText);
    const distractors = shuffled(others).slice(0, 3).map((w) => getAnswerText(w));

    return shuffled([correctText, ...distractors]);
  }, [currentWord, direction, distractorPool]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PromptCard label={promptLabel} text={promptText} edgeColor={edgeColor} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt) => {
          const isCorrectOption = opt === correctText;
          const isSelected = opt === answer;
          let bg = 'var(--surface)';
          let border = 'var(--border)';
          let color = 'var(--text)';

          if (selected) {
            if (isCorrectOption) {
              bg = 'rgba(111,191,154,0.15)';
              border = 'var(--good)';
              color = 'var(--good)';
            } else if (isSelected) {
              bg = 'rgba(224,122,99,0.15)';
              border = 'var(--bad)';
              color = 'var(--bad)';
            }
          }

          return (
            <button
              key={opt}
              onClick={() => setAnswer(opt)}
              disabled={selected}
              style={{
                padding: '15px 16px',
                borderRadius: 'var(--radius-m)',
                background: bg,
                border: `1.5px solid ${border}`,
                color,
                fontWeight: 600,
                fontSize: 15,
                textAlign: 'left',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {selected && (
        <>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
            <button
              style={{
                padding: '15px 16px',
                borderRadius: 'var(--radius-m)',
                background: 'rgba(111,191,154,0.15)',
                border: `1.5px solid 'var(--bad)`,
                color: 'var(--bad)',
                fontWeight: 600,
                fontSize: 15,
                textAlign: 'left',
              }}
              onClick={handleSubmit} >
              {"  Далі"}
            </button>
          </div></>)}
    </div>
  );
}

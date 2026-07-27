import { useRef, useEffect, FC, useState } from 'react';
import { PromptCard } from './PromptCard';
import { normalizeAnswer } from '../../learning/exercise-plan';
interface TypeInExerciseProps {
  promptLabel: string;
  promptText: string;
  edgeColor: string;
  maskedHint?: string;
  correctText: string;
  onSubmit: (isCorrect: boolean) => void;
}
const TypeInExercise: FC<TypeInExerciseProps> = ({
  promptLabel, promptText, edgeColor, maskedHint, correctText, onSubmit,
}: TypeInExerciseProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState<string>('');

  const [answer, setAnswer] = useState<string | null>(null);
  const isCorrect = normalizeAnswer(answer || '') === normalizeAnswer(correctText);

  const handleSubmit = () => {
    setAnswer("");
 setValue("");
   onSubmit(isCorrect);
  }

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 350);
    return () => window.clearTimeout(t);
  }, []);

  const submitted = Boolean(answer?.trim());
  const borderColor = submitted ? (isCorrect ? 'var(--good)' : 'var(--bad)') : 'var(--border)';

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PromptCard label={promptLabel} text={promptText} edgeColor={edgeColor} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {maskedHint && (
          <div
            className="mono"
            style={{ textAlign: 'center', fontSize: 22, letterSpacing: '0.12em', color: 'var(--text-dim)' }}
          >
            {maskedHint}
          </div>
        )}

        <input
          ref={inputRef}
          type="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder={maskedHint ? 'Впишіть повне слово…' : 'Впишіть переклад…'}
          value={value}
          disabled={submitted}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setAnswer(value);
          }}
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: 17,
            textAlign: 'center',
            borderRadius: 'var(--radius-m)',
            border: `1.5px solid ${borderColor}`,
          }} />

        {submitted && (
          <>
            <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--good)' }}>
              {isCorrect ? '✅ Правильно!' : `❌ Неправильно. Правильна відповідь: ${correctText}`}
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10 }}>
              <button
                style={{
                  padding: '15px',
                  borderRadius: 'var(--radius-m)',
                  background: value.trim() ? 'var(--gold)' : 'var(--surface-alt)',
                  color: value.trim() ? '#2a1e0c' : 'var(--text-faint)',
                  fontWeight: 700,
                  fontSize: 15,
                }}
                onClick={handleSubmit}>
                {"Далі"}
              </button>
            </div></>
        )}

        {!submitted && (
          <button
            onClick={() => setAnswer(value)}
            disabled={!value.trim()}
            style={{
              padding: '15px',
              borderRadius: 'var(--radius-m)',
              background: value.trim() ? 'var(--gold)' : 'var(--surface-alt)',
              color: value.trim() ? '#2a1e0c' : 'var(--text-faint)',
              fontWeight: 700,
              fontSize: 15,
            }}
          >
            Перевірити
          </button>
        )}


      </div>
    </div>
  );
}

export default TypeInExercise
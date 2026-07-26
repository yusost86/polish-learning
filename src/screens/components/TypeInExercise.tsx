import { useRef, useEffect } from 'react';
import { PromptCard } from './PromptCard';

export function TypeInExercise({
  promptLabel, promptText, edgeColor, maskedHint, correctText, value, onChange, submitted, isCorrect, onSubmit,
}: {
  promptLabel: string;
  promptText: string;
  edgeColor: string;
  maskedHint?: string;
  correctText: string;
  value: string;
  onChange: (v: string) => void;
  submitted: boolean;
  isCorrect: boolean;
  onSubmit: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => inputRef.current?.focus(), 350);
    return () => window.clearTimeout(t);
  }, []);

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
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') onSubmit();
          }}
          style={{
            width: '100%',
            padding: '14px 16px',
            fontSize: 17,
            textAlign: 'center',
            borderRadius: 'var(--radius-m)',
            border: `1.5px solid ${borderColor}`,
          }} />

        {submitted && !isCorrect && (
          <div style={{ textAlign: 'center', fontSize: 14, color: 'var(--good)' }}>
            Правильно: <strong>{correctText}</strong>
          </div>
        )}

        {!submitted && (
          <button
            onClick={onSubmit}
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

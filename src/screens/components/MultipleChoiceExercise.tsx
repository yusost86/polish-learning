import { PromptCard } from './PromptCard';

export function MultipleChoiceExercise({
  promptLabel, promptText, edgeColor, options, correctText, selected, onSelect,
}: {
  promptLabel: string;
  promptText: string;
  edgeColor: string;
  options: string[];
  correctText: string;
  selected: string | null;
  onSelect: (choice: string) => void;
}) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PromptCard label={promptLabel} text={promptText} edgeColor={edgeColor} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {options.map((opt) => {
          const isCorrectOption = opt === correctText;
          const isSelected = opt === selected;
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
              onClick={() => onSelect(opt)}
              disabled={!!selected}
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
    </div>
  );
}

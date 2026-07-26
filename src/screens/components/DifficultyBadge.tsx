import { InteractionKind } from '../GameScreen';

export function DifficultyBadge({ kind }: { kind: InteractionKind; }) {
  const config: Record<InteractionKind, { label: string; dots: number; }> = {
    MULTIPLE_CHOICE: { label: 'Легко · вибір варіанту', dots: 1 },
    FILL_BLANK: { label: 'Середньо · впишіть букви', dots: 2 },
    TYPE_IN: { label: 'Складно · впишіть слово', dots: 3 },
  };
  const { label, dots } = config[kind];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-faint)' }}>
      <div style={{ display: 'flex', gap: 3 }}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: i <= dots ? 'var(--gold)' : 'var(--border)',
            }} />
        ))}
      </div>
      {label}
    </div>
  );
}

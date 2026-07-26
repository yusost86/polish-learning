export function BackButton({ onClick }: { onClick: () => void; }) {
  return (
    <button
      onClick={onClick}
      style={{ padding: '13px 24px', borderRadius: 'var(--radius-m)', background: 'var(--gold)', color: '#2a1e0c', fontWeight: 700 }}
    >
      ← До меню
    </button>
  );
}

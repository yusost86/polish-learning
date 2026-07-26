export function PromptCard({ label, text, edgeColor }: { label: string; text: string; edgeColor: string; }) {
  return (
    <div
      style={{
        width: '100%',
        maxWidth: 340,
        borderRadius: 'var(--radius-l)',
        background: 'var(--surface)',
        border: `2px solid ${edgeColor}`,
        boxShadow: '0 20px 40px rgba(0,0,0,0.35)',
        padding: '32px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        margin: '0 auto',
      }}
    >
      <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: edgeColor, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
        {label}
      </span>
      <span style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 700, lineHeight: 1.2 }}>{text}</span>
    </div>
  );
}

interface PromptCardProps {
  label: string;
  prompt: string;
  isMaskedWord?: boolean;
}

export function PromptCard({ label, prompt, isMaskedWord = false }: PromptCardProps) {
  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-l)",
        padding: "22px 20px",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 10 }}>{label}</div>
      <div
        className={isMaskedWord ? "mono" : undefined}
        style={{
          fontFamily: isMaskedWord ? "var(--font-mono)" : "var(--font-display)",
          fontSize: isMaskedWord ? 28 : 32,
          fontWeight: 700,
          letterSpacing: isMaskedWord ? "0.08em" : "-0.02em",
          lineHeight: 1.3,
        }}
      >
        {prompt}
      </div>
    </section>
  );
}

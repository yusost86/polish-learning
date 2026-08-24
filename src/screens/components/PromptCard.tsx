interface PromptCardProps {
  label: string;
  prompt: string;
  isMaskedWord?: boolean;
  hint?: string;
}

export function PromptCard({ label, prompt, isMaskedWord = false, hint }: PromptCardProps) {
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
      {hint && (
        <div style={{ fontSize: 15, color: "var(--text-dim)", marginBottom: 12 }}>{hint}</div>
      )}
      <div
        className={isMaskedWord ? "mono" : undefined}
        style={{
          fontFamily: isMaskedWord ? "var(--font-mono)" : "var(--font-display)",
          fontSize: isMaskedWord ? 24 : 32,
          fontWeight: 700,
          letterSpacing: isMaskedWord ? "0.04em" : "-0.02em",
          lineHeight: 1.4,
        }}
      >
        {prompt}
      </div>
    </section>
  );
}

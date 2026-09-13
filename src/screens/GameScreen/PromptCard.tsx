interface PromptCardProps {
  label?: string;
  prompt: string;
  isMaskedWord?: boolean;
  title?: string;
}

export function PromptCard({ label, prompt, isMaskedWord = false, title }: PromptCardProps) {
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
      {label && (
        <div style={{ fontSize: 13, color: "var(--text-dim)", marginBottom: 10 }}>{label}</div>
      )}
      {title && (
        <div
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 32,
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.3,
            marginBottom: 14,
          }}
        >
          {title}
        </div>
      )}
      <div
        className={isMaskedWord ? "mono" : undefined}
        style={{
          fontFamily: isMaskedWord ? "var(--font-mono)" : "var(--font-display)",
          fontSize: isMaskedWord ? 22 : 32,
          fontWeight: 700,
          letterSpacing: isMaskedWord ? "0.04em" : "-0.02em",
          lineHeight: 1.4,
          color: title ? "var(--text-dim)" : undefined,
        }}
      >
        {prompt}
      </div>
    </section>
  );
}

interface SettingsViewProps {
  devMode: boolean;
  onDevModeChange: (value: boolean) => void;
}

export function SettingsView({ devMode, onDevModeChange }: SettingsViewProps) {
  return (
    <section
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-l)",
        padding: "18px 20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 16 }}>Dev mode</div>
        <div style={{ marginTop: 4, fontSize: 13, color: "var(--text-dim)", lineHeight: 1.4 }}>
          Кнопки «Вірно» / «Невірно» в сесії для ручної оцінки.
        </div>
      </div>
      <button
        type="button"
        aria-pressed={devMode}
        onClick={() => onDevModeChange(!devMode)}
        style={{
          flexShrink: 0,
          padding: "10px 14px",
          borderRadius: "var(--radius-s)",
          background: devMode ? "var(--gold)" : "var(--surface-alt)",
          color: devMode ? "#2a1e0c" : "var(--text-dim)",
          fontWeight: 700,
          fontSize: 13,
        }}
      >
        {devMode ? "Увімкнено" : "Вимкнено"}
      </button>
    </section>
  );
}

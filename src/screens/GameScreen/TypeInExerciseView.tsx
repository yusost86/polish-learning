interface TypeInExerciseViewProps {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export function TypeInExerciseView({ value, disabled, onChange, onSubmit }: TypeInExerciseViewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <input
        type="text"
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && value.trim()) {
            onSubmit();
          }
        }}
        placeholder="Введіть слово повністю"
        aria-label="Відповідь"
        autoComplete="off"
        autoCapitalize="off"
        spellCheck={false}
        style={{
          width: "100%",
          padding: "14px 16px",
          borderRadius: "var(--radius-m)",
          fontSize: 16,
          fontFamily: "var(--font-mono)",
        }}
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        style={{
          padding: "13px 16px",
          borderRadius: "var(--radius-s)",
          background: "var(--gold)",
          color: "#2a1e0c",
          fontWeight: 700,
          fontSize: 15,
        }}
      >
        Перевірити
      </button>
    </div>
  );
}

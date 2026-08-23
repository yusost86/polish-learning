interface BackButtonProps {
  onClick: () => void;
}

export function BackButton({ onClick }: BackButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label="Назад"
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        fontSize: 18,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      ←
    </button>
  );
}

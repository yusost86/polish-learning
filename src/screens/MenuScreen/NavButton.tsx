interface NavButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
}

export function NavButton({ icon, label, onClick }: NavButtonProps) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      style={{
        flex: 1,
        padding: "14px 10px",
        borderRadius: "var(--radius-m)",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        fontWeight: 600,
        fontSize: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      {label}
    </button>
  );
}

import type { TopicStatViewModel } from "../../ui/viewModels/MenuViewModel";

interface TopicCardProps {
  stat: TopicStatViewModel;
  onPrimaryAction: () => void;
  onOpenDetails: () => void;
}

export function TopicCard({ stat, onPrimaryAction, onOpenDetails }: TopicCardProps) {
  const isReview = stat.primaryAction === "review";
  const label = isReview ? "Повторити" : "Вивчити";
  const isDisabled =
    stat.total === 0 ||
    (isReview && stat.due === 0) ||
    (!isReview && stat.learnable === 0);

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-m)",
        padding: "14px 16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
        <button
          onClick={onOpenDetails}
          style={{
            fontWeight: 700,
            fontSize: 16,
            background: "none",
            border: "none",
            color: "var(--text)",
            padding: 0,
            textAlign: "left",
          }}
        >
          {stat.name}
        </button>
        <div className="mono" style={{ fontSize: 12, color: "var(--text-faint)" }}>
          {stat.learned}/{stat.total}
        </div>
      </div>
      <button
        disabled={isDisabled}
        onClick={onPrimaryAction}
        aria-label={`${label}: ${stat.name}`}
        style={{
          width: "100%",
          padding: "10px",
          borderRadius: "var(--radius-s)",
          background: isDisabled ? "var(--surface-alt)" : isReview ? "var(--blue)" : "var(--gold)",
          color: isDisabled ? "var(--text-faint)" : isReview ? "#0d1c2b" : "#2a1e0c",
          fontWeight: 700,
          fontSize: 13,
          cursor: isDisabled ? "not-allowed" : "pointer",
        }}
      >
        {label}
      </button>
      <button
        onClick={onOpenDetails}
        style={{
          marginTop: 8,
          width: "100%",
          padding: "9px",
          borderRadius: "var(--radius-s)",
          background: "var(--surface-alt)",
          color: "var(--text-dim)",
          fontWeight: 600,
          fontSize: 12,
        }}
      >
        Черга вправ і слова
      </button>
    </div>
  );
}

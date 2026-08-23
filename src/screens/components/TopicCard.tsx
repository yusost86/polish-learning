import type { TopicStatViewModel } from "../../ui/viewModels/MenuViewModel";

interface TopicCardProps {
  stat: TopicStatViewModel;
  onLearnNew: () => void;
  onReview: () => void;
  onOpenDetails: () => void;
}

export function TopicCard({ stat, onLearnNew, onReview, onOpenDetails }: TopicCardProps) {
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
      <div style={{ display: "flex", gap: 8 }}>
        <button
          disabled={stat.total === 0}
          onClick={onLearnNew}
          aria-label={`Вивчити нові: ${stat.name}`}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "var(--radius-s)",
            background: "var(--gold)",
            color: "#2a1e0c",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Вивчити нові{stat.new > 0 ? ` (${stat.new})` : ""}
        </button>
        <button
          onClick={onReview}
          style={{
            flex: 1,
            padding: "10px",
            borderRadius: "var(--radius-s)",
            background: stat.due === 0 ? "var(--surface-alt)" : "var(--blue)",
            color: stat.due === 0 ? "var(--text-faint)" : "#0d1c2b",
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          Повторити{stat.due > 0 ? ` (${stat.due})` : ""}
        </button>
      </div>
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

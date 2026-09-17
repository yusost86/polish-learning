
import type { TopicStatViewModel } from "../../ui/viewModels/MenuViewModel";

interface TopicCardProps {
  stat: TopicStatViewModel;
  onClick: () => void;
}

export function TopicCard({ stat, onClick }: TopicCardProps) {

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      aria-label={`Відкрити тему: ${stat.name}`}
      style={{
        background: "var(--surface)",
        border: `1px solid ${ "var(--border)"}`,
        borderRadius: "var(--radius-m)",
        padding: "14px 16px",
        cursor: "pointer",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{stat.name}</div>
        <div className="mono" style={{ fontSize: 12, color: "var(--text-faint)" }}>
          {stat.learned}/{stat.total}
        </div>
      </div>
    </div>
  );
}

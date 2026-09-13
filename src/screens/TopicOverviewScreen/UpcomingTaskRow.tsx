import type { UpcomingTaskViewModel } from "../../ui/viewModels/TopicOverviewViewModel";
import { masteryPercent } from "../../utils/topicDisplayUtils";

interface UpcomingTaskRowProps {
  task: UpcomingTaskViewModel;
}

export function UpcomingTaskRow({ task }: UpcomingTaskRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "24px 1fr auto",
        gap: "10px 12px",
        alignItems: "start",
        padding: "12px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <div className="mono" style={{ fontSize: 12, color: "var(--text-faint)", paddingTop: 2 }}>
        {task.index}
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{task.term}</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>{task.translation}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: 999,
              background: "var(--surface-alt)",
              color: "var(--gold)",
            }}
          >
            {task.exerciseLabel}
          </span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              padding: "3px 8px",
              borderRadius: 999,
              background: "var(--surface-alt)",
              color: "var(--text-dim)",
            }}
          >
            {task.reasonLabel}
          </span>
        </div>
      </div>
      <div style={{ textAlign: "right", minWidth: 52 }}>
        <div className="mono" style={{ fontSize: 12, color: "var(--blue)" }}>
          P{task.priorityDisplay}
        </div>
        <div className="mono" style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
          {masteryPercent(task.mastery)}
        </div>
      </div>
    </div>
  );
}

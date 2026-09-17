import type { TopicWordViewModel } from "../../ui/viewModels/TopicOverviewViewModel";
import { wordStateLabel } from "../../utils/topicDisplayUtils";

interface TopicWordRowProps {
  word: TopicWordViewModel;
}

export function TopicWordRow({ word }: TopicWordRowProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-m)",
        padding: "12px 14px",
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: 12,
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 15 }}>{word.term}</div>
        <div style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 2 }}>{word.translation}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="mono" style={{ fontSize: 13, color: "var(--gold)" }}>
          {word.consecutiveCorrect}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
          {wordStateLabel(word.state)}
        </div>
      </div>
    </div>
  );
}

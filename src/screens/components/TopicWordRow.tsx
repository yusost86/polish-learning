import type { TopicWordViewModel } from "../../ui/viewModels/TopicOverviewViewModel";
import { masteryPercent, wordStateLabel } from "../../utils/topicDisplayUtils";

interface TopicWordRowProps {
  word: TopicWordViewModel;
}

function skillBar(label: string, value: number): JSX.Element {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "72px 1fr 34px", gap: 8, alignItems: "center" }}>
      <div style={{ fontSize: 11, color: "var(--text-faint)" }}>{label}</div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: "var(--surface-alt)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${Math.round(value * 100)}%`,
            height: "100%",
            background: "var(--good)",
            borderRadius: 999,
          }}
        />
      </div>
      <div className="mono" style={{ fontSize: 10, color: "var(--text-faint)", textAlign: "right" }}>
        {masteryPercent(value)}
      </div>
    </div>
  );
}

export function TopicWordRow({ word }: TopicWordRowProps) {
  return (
    <details
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-m)",
        padding: "12px 14px",
      }}
    >
      <summary
        style={{
          cursor: "pointer",
          listStyle: "none",
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
            {masteryPercent(word.mastery)}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 4 }}>
            {wordStateLabel(word.state)}
          </div>
        </div>
      </summary>

      <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12 }}>
          <div>
            <span style={{ color: "var(--text-faint)" }}>FSRS: </span>
            <span className="mono">{word.fsrsStatus}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-faint)" }}>Priority: </span>
            <span className="mono">P{word.priorityDisplay}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-faint)" }}>Спроб: </span>
            <span className="mono">{word.totalAttempts}</span>
          </div>
          <div>
            <span style={{ color: "var(--text-faint)" }}>Помилок: </span>
            <span className="mono">{word.errorCount}</span>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {skillBar("Rec", word.skills.recognition)}
          {skillBar("Recall", word.skills.recall)}
          {skillBar("Prod", word.skills.production)}
          {skillBar("Ctx", word.skills.context)}
        </div>
      </div>
    </details>
  );
}

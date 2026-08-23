import type { TopicOverviewViewModel } from "../../ui/viewModels/TopicOverviewViewModel";
import { BackButton } from "./BackButton";
import { StatRow } from "./StatRow";
import { TopicWordRow } from "./TopicWordRow";
import { UpcomingTaskRow } from "./UpcomingTaskRow";

interface TopicOverviewViewProps {
  overview: TopicOverviewViewModel;
  onBack: () => void;
  onRefresh: () => void;
  onStartSession: () => void;
}

export function TopicOverviewView({
  overview,
  onBack,
  onRefresh,
  onStartSession,
}: TopicOverviewViewProps) {
  const { topicProgress } = overview;
  const masteredPct = topicProgress.totalWords
    ? Math.round((topicProgress.masteredCount / topicProgress.totalWords) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <BackButton onClick={onBack} />
        <button
          onClick={onRefresh}
          style={{
            padding: "8px 12px",
            borderRadius: "var(--radius-s)",
            background: "var(--surface-alt)",
            color: "var(--text-dim)",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          Оновити
        </button>
      </div>

      <header>
        <div style={{ fontSize: 13, color: "var(--gold)", fontWeight: 600, marginBottom: 4 }}>Тема</div>
        <h1 style={{ fontSize: 26 }}>{overview.topicName}</h1>
      </header>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-l)",
          padding: "18px 20px",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)", marginBottom: 12 }}>
          Прогрес теми
        </div>
        <StatRow label="Слів у темі" value={topicProgress.totalWords} />
        <StatRow label="Засвоєних (≥65%)" value={topicProgress.masteredCount} />
        <StatRow label="Критичних" value={topicProgress.criticalCount} />
        <StatRow label="Прогрес" value={`${masteredPct}%`} />
        {topicProgress.canOpenNextWave && (
          <div style={{ marginTop: 10, fontSize: 13, color: "var(--good)", fontWeight: 600 }}>
            Наступна хвиля доступна
          </div>
        )}
        <button
          onClick={onStartSession}
          style={{
            marginTop: 14,
            width: "100%",
            padding: "13px 16px",
            borderRadius: "var(--radius-s)",
            background: "var(--gold)",
            color: "#2a1e0c",
            fontWeight: 700,
            fontSize: 15,
          }}
        >
          Почати сесію
        </button>
      </section>

      <section>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-dim)",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Наступна сесія ({overview.upcomingTasks.length})
        </div>
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-m)",
            padding: "4px 16px",
          }}
        >
          {overview.upcomingTasks.length === 0 && (
            <div style={{ padding: "16px 0", color: "var(--text-faint)", fontSize: 14 }}>
              Черга порожня.
            </div>
          )}
          {overview.upcomingTasks.map((task) => (
            <UpcomingTaskRow key={`${task.wordId}-${task.index}`} task={task} />
          ))}
        </div>
      </section>

      {overview.followingTasks.length > 0 && (
        <section>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: "var(--text-dim)",
              marginBottom: 10,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Далі в черзі ({overview.followingTasks.length})
          </div>
          <div
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-m)",
              padding: "4px 16px",
              opacity: 0.85,
            }}
          >
            {overview.followingTasks.map((task) => (
              <UpcomingTaskRow key={`${task.wordId}-${task.index}`} task={task} />
            ))}
          </div>
        </section>
      )}

      <section>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "var(--text-dim)",
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          Слова теми ({overview.words.length})
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {overview.words.map((word) => (
            <TopicWordRow key={word.wordId} word={word} />
          ))}
        </div>
      </section>
    </div>
  );
}

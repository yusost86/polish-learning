import type { MenuSummary, TopicStatViewModel } from "../../ui/viewModels/MenuViewModel";
import { StatRow } from "../components/StatRow";
import { NavButton } from "./NavButton";
import { TopicCard } from "./TopicCard";

interface MenuViewProps {
  summary: MenuSummary;
  topicStats: TopicStatViewModel[];
  loading: boolean;
  error: string | null;
  appVersion: string;
  devMode: boolean;
  onRepeatDue: () => void;
  onOpenTopic: (topicId: string) => void;
  onOpenStats: () => void;
  onOpenWords: () => void;
  onOpenSettings: () => void;
}

export function MenuView({
  summary,
  topicStats,
  loading,
  error,
  appVersion,
  devMode,
  onRepeatDue,
  onOpenTopic,
  onOpenStats,
  onOpenWords,
  onOpenSettings,
}: MenuViewProps) {
  const progressPct = summary.totalUniqueWords
    ? Math.round((summary.learnedWordsCount / summary.totalUniqueWords) * 100)
    : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header>
        <div
          style={{
            fontSize: 13,
            color: "var(--gold)",
            fontWeight: 600,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          Pol ↔ Укр
        </div>
        <h1 style={{ fontSize: 28, marginTop: 4 }}>Словник</h1>
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
          📦 Загальний словник
        </div>
        {loading && (
          <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 14 }}>Завантаження…</p>
        )}
        {error && !loading && (
          <p style={{ margin: 0, color: "var(--bad)", fontSize: 14 }}>{error}</p>
        )}
        {!loading && !error && (
          <>
            <StatRow label="Унікальних слів" value={summary.totalUniqueWords} />
            <StatRow label="Нових слів" value={summary.newWordsCount} />
            <StatRow label="Вивчених слів" value={summary.learnedWordsCount} />
            <StatRow label="Прогрес" value={`${progressPct}%`} />
            {summary.dueNowCount > 0 && (
              <button
                onClick={onRepeatDue}
                style={{
                  marginTop: 14,
                  width: "100%",
                  padding: "13px 16px",
                  borderRadius: "var(--radius-s)",
                  background: "var(--bad)",
                  color: "#241211",
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                🔴 Повторити {summary.dueNowCount} слів
              </button>
            )}
          </>
        )}
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
          📚 Теми
        </div>
        {topicStats.length === 0 && (
          <div style={{ color: "var(--text-faint)", fontSize: 14, lineHeight: 1.5 }}>
            Тем ще немає.
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {topicStats.map((stat) => (
            <TopicCard
              key={stat.topicId}
              stat={stat}
              onClick={() => onOpenTopic(stat.topicId)}
            />
          ))}
        </div>
      </section>

      <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
        <NavButton icon="📊" label="Статистика" onClick={onOpenStats} />
        <NavButton icon="📖" label="Всі слова" onClick={onOpenWords} />
        <NavButton icon="⚙️" label="Налаштування" onClick={onOpenSettings} />
      </div>

      <div
        className="mono"
        style={{
          marginTop: 8,
          textAlign: "center",
          fontSize: 11,
          color: "var(--text-faint)",
          letterSpacing: "0.04em",
        }}
      >
        v{appVersion}
        {devMode ? " · dev" : ""}
      </div>
    </div>
  );
}

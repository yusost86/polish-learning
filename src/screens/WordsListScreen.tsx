import { useWordsListScreen } from "../hooks/useWordsListScreen";
import { BackButton } from "./components/BackButton";

export default function WordsListScreen() {
  const { topics, onBack, onOpenTopic } = useWordsListScreen();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <BackButton onClick={onBack} />
      <header>
        <h1 style={{ fontSize: 26 }}>Теми та слова</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-dim)", fontSize: 14, lineHeight: 1.5 }}>
          Оберіть тему, щоб переглянути наступні вправи та прогрес по кожному слову.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {topics.map((topic) => (
          <button
            key={topic.topicId}
            onClick={() => onOpenTopic(topic.topicId)}
            style={{
              textAlign: "left",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-m)",
              padding: "14px 16px",
              color: "var(--text)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{topic.name}</div>
              <div className="mono" style={{ fontSize: 12, color: "var(--text-faint)" }}>
                {topic.wordCount} слів
              </div>
            </div>
            <div style={{ marginTop: 6, fontSize: 13, color: "var(--text-dim)" }}>
              Черга вправ · mastery · FSRS
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

import { useWordsListScreen } from "../hooks/useWordsListScreen";
import { BackButton } from "./components/BackButton";

export default function WordsListScreen() {
  const {
    topics,
    importText,
    importMessage,
    importError,
    importing,
    deletingTopicId,
    deleteMessage,
    deleteError,
    onBack,
    onOpenTopic,
    onDeleteTopic,
    onImportTextChange,
    onImportWords,
    onUseExample,
  } = useWordsListScreen();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <BackButton onClick={onBack} />
      <header>
        <h1 style={{ fontSize: 26 }}>Теми та слова</h1>
        <p style={{ margin: "8px 0 0", color: "var(--text-dim)", fontSize: 14, lineHeight: 1.5 }}>
          Оберіть тему, додайте нові слова або видаліть тему разом із усім прогресом.
        </p>
      </header>

      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-l)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--gold)" }}>Додати слова</div>
        <p style={{ margin: 0, color: "var(--text-dim)", fontSize: 13, lineHeight: 1.5 }}>
          Формат: <code>[{"{ topic, words: { pl, ua } }"}]</code> або масив words у записі. Дублікати в
          межах теми пропускаються; те саме слово може бути в різних темах.
        </p>
        <textarea
          value={importText}
          onChange={(event) => onImportTextChange(event.target.value)}
          placeholder='[{"topic":"health","words":{"pl":"lekarz","ua":"лікар"}}]'
          rows={8}
          style={{
            width: "100%",
            resize: "vertical",
            padding: "12px",
            borderRadius: "var(--radius-s)",
            border: "1px solid var(--border)",
            background: "var(--surface-alt)",
            color: "var(--text)",
            fontFamily: "ui-monospace, monospace",
            fontSize: 13,
          }}
        />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <button
            onClick={() => void onImportWords()}
            disabled={importing || !importText.trim()}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-s)",
              background: "var(--gold)",
              color: "#2a1e0c",
              fontWeight: 700,
              fontSize: 14,
              opacity: importing || !importText.trim() ? 0.6 : 1,
            }}
          >
            {importing ? "Імпорт…" : "Імпортувати"}
          </button>
          <button
            onClick={onUseExample}
            style={{
              padding: "10px 14px",
              borderRadius: "var(--radius-s)",
              background: "var(--surface-alt)",
              color: "var(--text-dim)",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Приклад JSON
          </button>
        </div>
        {importMessage && (
          <p style={{ margin: 0, color: "var(--good)", fontSize: 14, whiteSpace: "pre-wrap" }}>{importMessage}</p>
        )}
        {importError && (
          <p style={{ margin: 0, color: "var(--bad)", fontSize: 14, whiteSpace: "pre-wrap" }}>{importError}</p>
        )}
      </section>

      {deleteMessage && (
        <p style={{ margin: 0, color: "var(--good)", fontSize: 14, whiteSpace: "pre-wrap" }}>{deleteMessage}</p>
      )}
      {deleteError && (
        <p style={{ margin: 0, color: "var(--bad)", fontSize: 14, whiteSpace: "pre-wrap" }}>{deleteError}</p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {topics.map((topic) => (
          <div
            key={topic.topicId}
            style={{
              display: "flex",
              gap: 10,
              alignItems: "stretch",
            }}
          >
            <button
              onClick={() => onOpenTopic(topic.topicId)}
              style={{
                flex: 1,
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
            <button
              onClick={() => void onDeleteTopic(topic)}
              disabled={deletingTopicId === topic.topicId}
              aria-label={`Видалити тему ${topic.name}`}
              style={{
                flexShrink: 0,
                padding: "0 14px",
                borderRadius: "var(--radius-m)",
                background: "var(--surface-alt)",
                border: "1px solid var(--border)",
                color: "var(--bad)",
                fontWeight: 700,
                fontSize: 13,
                opacity: deletingTopicId === topic.topicId ? 0.6 : 1,
              }}
            >
              {deletingTopicId === topic.topicId ? "…" : "Видалити"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

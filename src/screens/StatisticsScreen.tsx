import { HARDCODED_MENU_SUMMARY } from "../hooks/useMenuScreen";
import { usePlaceholderScreen } from "../hooks/usePlaceholderScreen";
import { PlaceholderView } from "./components/PlaceholderView";
import { StatRow } from "./components/StatRow";

export default function StatisticsScreen() {
  const { onBack } = usePlaceholderScreen();
  const summary = HARDCODED_MENU_SUMMARY;
  const progressPct = summary.totalUniqueWords
    ? Math.round((summary.learnedWordsCount / summary.totalUniqueWords) * 100)
    : 0;

  return (
    <PlaceholderView title="Статистика" onBack={onBack}>
      <section
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-l)",
          padding: "18px 20px",
        }}
      >
        <StatRow label="Унікальних слів" value={summary.totalUniqueWords} />
        <StatRow label="Нових слів" value={summary.newWordsCount} />
        <StatRow label="Вивчених слів" value={summary.learnedWordsCount} />
        <StatRow label="До повторення" value={summary.dueNowCount} />
        <StatRow label="Прогрес" value={`${progressPct}%`} />
      </section>
    </PlaceholderView>
  );
}

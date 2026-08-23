import { useTopicOverview } from "../hooks/useTopicOverview";
import { PlaceholderView } from "./components/PlaceholderView";
import { TopicOverviewView } from "./components/TopicOverviewView";

export default function TopicOverviewScreen() {
  const { overview, loading, error, onBack, onRefresh, onStartSession } = useTopicOverview();

  if (loading) {
    return (
      <PlaceholderView
        title="Завантаження…"
        detail="Отримуємо чергу вправ і прогрес слів."
        onBack={onBack}
      />
    );
  }

  if (error || !overview) {
    return (
      <PlaceholderView
        title="Помилка"
        detail={error ?? "Тему не знайдено"}
        onBack={onBack}
      />
    );
  }

  return (
    <TopicOverviewView
      overview={overview}
      onBack={onBack}
      onRefresh={onRefresh}
      onStartSession={onStartSession}
    />
  );
}

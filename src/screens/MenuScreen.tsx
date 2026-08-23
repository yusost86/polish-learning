import { useMenuScreen } from "../hooks/useMenuScreen";
import { MenuView } from "./components/MenuView";

export default function MenuScreen() {
  const {
    summary,
    topicStats,
    loading,
    error,
    appVersion,
    onRepeatDue,
    onLearnTopic,
    onReviewTopic,
    onOpenTopic,
    onOpenStats,
    onOpenWords,
  } = useMenuScreen();

  return (
    <MenuView
      summary={summary}
      topicStats={topicStats}
      loading={loading}
      error={error}
      appVersion={appVersion}
      onRepeatDue={onRepeatDue}
      onLearnTopic={onLearnTopic}
      onReviewTopic={onReviewTopic}
      onOpenTopic={onOpenTopic}
      onOpenStats={onOpenStats}
      onOpenWords={onOpenWords}
    />
  );
}

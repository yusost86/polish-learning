import { useMenuScreen } from "../hooks/useMenuScreen";
import { MenuView } from "./components/MenuView";

export default function MenuScreen() {
  const {
    summary,
    topicStats,
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

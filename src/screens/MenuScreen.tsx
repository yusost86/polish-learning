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
    onTopicPrimaryAction,
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
      onTopicPrimaryAction={onTopicPrimaryAction}
      onOpenTopic={onOpenTopic}
      onOpenStats={onOpenStats}
      onOpenWords={onOpenWords}
    />
  );
}

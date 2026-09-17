import { useMenuScreen } from "../../hooks/useMenuScreen";
import { MenuView } from "./MenuView";

export default function MenuScreen() {
  const {
    summary,
    topicStats,
    loading,
    error,
    appVersion,
    devMode,
    onRepeatDue,
    onTopicPrimaryAction,
    onOpenTopic,
    onOpenStats,
    onOpenWords,
    onOpenSettings,
  } = useMenuScreen();

  return (
    <MenuView
      summary={summary}
      topicStats={topicStats}
      loading={loading}
      error={error}
      appVersion={appVersion}
      devMode={devMode}
      onRepeatDue={onRepeatDue}
      onTopicPrimaryAction={onTopicPrimaryAction}
      onOpenTopic={onOpenTopic}
      onOpenStats={onOpenStats}
      onOpenWords={onOpenWords}
      onOpenSettings={onOpenSettings}
    />
  );
}

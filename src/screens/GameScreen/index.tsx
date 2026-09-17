import { getTopicName } from "../../data/wordCatalog";
import { useAppSettings } from "../../hooks/useAppSettings";
import { useExerciseSession } from "../../hooks/useExerciseSession";
import { useGameScreen } from "../../hooks/useGameScreen";
import { PlaceholderView } from "../components/PlaceholderView";
import { GameSessionView } from "./GameSessionView";

export default function GameScreen() {
  const {topicId, isValidSession, onBack } = useGameScreen();
  const session = useExerciseSession({topicId, onBack });
  const { devMode } = useAppSettings();

  if (!isValidSession) {
    return (
      <PlaceholderView
        title="Сесію не запущено"
        detail="Оберіть режим з меню: вивчити нові або повторити слова."
        onBack={onBack}
      />
    );
  }

  return (
    <GameSessionView
      phase={session.phase}
      exercise={session.exercise}
      progress={session.progress}
      modeLabel={session.modeLabel}
      topicLabel={topicId ? ` · ${getTopicName(topicId)}` : ""}
      onBack={session.onBack}
      onContinue={session.onContinue}
      onRetry={session.onRetry}
      loadError={session.loadError}
      devMode={devMode}
    />
  );
}

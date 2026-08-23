import { useExerciseSession } from "../hooks/useExerciseSession";
import { useGameScreen } from "../hooks/useGameScreen";
import { GameSessionView } from "./components/GameSessionView";
import { PlaceholderView } from "./components/PlaceholderView";

export default function GameScreen() {
  const { mode, topicId, isValidSession, onBack } = useGameScreen();
  const session = useExerciseSession({ mode, topicId, onBack });

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
      task={session.task}
      progress={session.progress}
      modeLabel={session.modeLabel}
      topicId={topicId}
      selectedChoiceId={session.selectedChoiceId}
      typedAnswer={session.typedAnswer}
      isCorrect={session.isCorrect}
      correctAnswerLabel={session.correctAnswerLabel}
      onBack={session.onBack}
      onSelectAnswer={session.onSelectAnswer}
      onTypedAnswerChange={session.onTypedAnswerChange}
      onSubmitTypedAnswer={session.onSubmitTypedAnswer}
      onContinue={session.onContinue}
      onRetry={session.onRetry}
      loadError={session.loadError}
    />
  );
}

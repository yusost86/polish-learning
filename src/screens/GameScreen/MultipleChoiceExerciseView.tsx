import type { ChoiceOption } from "../../domain/models/ExerciseTask";

interface MultipleChoiceExerciseViewProps {
  choices: ChoiceOption[];
  selectedChoiceId: string | null;
  correctChoiceId: string | null;
  disabled: boolean;
  onSelect: (choiceId: string) => void;
}

function choiceStyle(selected: boolean, correct: boolean, wrong: boolean) {
  if (correct) {
    return { background: "rgba(111, 191, 154, 0.18)", border: "1px solid var(--good)", color: "var(--text)" };
  }
  if (wrong) {
    return { background: "rgba(224, 122, 99, 0.18)", border: "1px solid var(--bad)", color: "var(--text)" };
  }
  if (selected) {
    return { background: "var(--surface-alt)", border: "1px solid var(--blue)", color: "var(--text)" };
  }
  return { background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" };
}

export function MultipleChoiceExerciseView({
  choices,
  selectedChoiceId,
  correctChoiceId,
  disabled,
  onSelect,
}: MultipleChoiceExerciseViewProps) {
  const showResults = selectedChoiceId !== null && correctChoiceId !== null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {choices.map((choice) => {
        const isSelected = selectedChoiceId === choice.id;
        const isCorrect = showResults && choice.id === correctChoiceId;
        const isWrong = showResults && isSelected && choice.id !== correctChoiceId;
        const style = choiceStyle(isSelected, isCorrect, isWrong);

        return (
          <button
            key={choice.id}
            disabled={disabled}
            onClick={() => onSelect(choice.id)}
            style={{
              ...style,
              width: "100%",
              padding: "14px 16px",
              borderRadius: "var(--radius-m)",
              fontWeight: 600,
              fontSize: 15,
              textAlign: "left",
            }}
          >
            {choice.label}
          </button>
        );
      })}
    </div>
  );
}

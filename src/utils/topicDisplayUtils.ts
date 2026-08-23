import { SelectionReason } from "../domain/enums/SelectionReason";
import { WordState } from "../domain/enums/WordState";

export function selectionReasonLabel(reason: SelectionReason): string {
  switch (reason) {
    case SelectionReason.CriticalWeak:
      return "Критичне";
    case SelectionReason.HighErrors:
      return "Багато помилок";
    case SelectionReason.Overdue:
      return "Прострочене";
    case SelectionReason.FsrsDue:
      return "Due (FSRS)";
    case SelectionReason.WeakContext:
      return "Слабкий контекст";
    case SelectionReason.WeakProduction:
      return "Слабка продукція";
    case SelectionReason.WeakRecall:
      return "Слабке пригадування";
    case SelectionReason.NewWord:
      return "Нове слово";
    case SelectionReason.Learning:
      return "Навчання";
    case SelectionReason.MixedReview:
      return "Mixed review";
  }
}

export function wordStateLabel(state: WordState): string {
  switch (state) {
    case WordState.New:
      return "Нове";
    case WordState.Learning:
      return "Вивчається";
    case WordState.Consolidating:
      return "Закріплення";
    case WordState.Mature:
      return "Засвоєне";
    case WordState.Relearning:
      return "Повторне";
  }
}

export function masteryPercent(mastery: number): string {
  return `${Math.round(mastery * 100)}%`;
}

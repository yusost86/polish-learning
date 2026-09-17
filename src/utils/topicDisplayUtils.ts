import { WordState } from "../domain/enums/WordState";

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

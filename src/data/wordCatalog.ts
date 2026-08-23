import type { Word } from "../domain/models/Word";

export const DEFAULT_STUDENT_ID = "student-1";

export const TOPIC_NAMES: Record<string, string> = {
  travel: "Подорожі",
  food: "Їжа",
  "daily-life": "Побут",
};

export const CATALOG_WORDS: Word[] = [
  { id: "airport", term: "lotnisko", translation: "аеропорт", topicId: "travel" },
  { id: "boarding-pass", term: "karta pokładowa", translation: "посадковий талон", topicId: "travel" },
  { id: "departure", term: "odlot", translation: "відправлення", topicId: "travel" },
  { id: "arrival", term: "przylot", translation: "приліт", topicId: "travel" },
  { id: "luggage", term: "bagaż", translation: "багаж", topicId: "travel" },
  { id: "flight", term: "lot", translation: "рейс", topicId: "travel" },
  { id: "reservation", term: "rezerwacja", translation: "бронювання", topicId: "travel" },
  { id: "gate", term: "bramka", translation: "вихід на посадку", topicId: "travel" },
  { id: "passport", term: "paszport", translation: "паспорт", topicId: "travel" },
  { id: "train-station", term: "dworzec", translation: "вокзал", topicId: "travel" },
  { id: "menu", term: "menu", translation: "меню", topicId: "food" },
  { id: "waiter", term: "kelner", translation: "офіціант", topicId: "food" },
  { id: "bill", term: "rachunek", translation: "рахунок", topicId: "food" },
  { id: "tip", term: "napiwek", translation: "чайові", topicId: "food" },
  { id: "reservation-food", term: "rezerwacja stolika", translation: "бронювання столика", topicId: "food" },
  { id: "dessert", term: "deser", translation: "десерт", topicId: "food" },
  { id: "appetizer", term: "przystawka", translation: "закуска", topicId: "food" },
  { id: "order", term: "zamówić", translation: "замовити", topicId: "food" },
  { id: "spicy", term: "pikantny", translation: "гострий", topicId: "food" },
  { id: "delicious", term: "pyszny", translation: "смачний", topicId: "food" },
  { id: "breakfast", term: "śniadanie", translation: "сніданок", topicId: "daily-life" },
  { id: "shopping", term: "zakupy", translation: "покупки", topicId: "daily-life" },
  { id: "transport", term: "transport", translation: "транспорт", topicId: "daily-life" },
  { id: "appointment", term: "wizyta", translation: "зустріч", topicId: "daily-life" },
  { id: "neighbor", term: "sąsiad", translation: "сусід", topicId: "daily-life" },
  { id: "schedule", term: "rozkład", translation: "розклад", topicId: "daily-life" },
  { id: "exercise", term: "ćwiczenie", translation: "вправа", topicId: "daily-life" },
];

export function getTopicName(topicId: string): string {
  return TOPIC_NAMES[topicId] ?? topicId;
}

export function getCatalogTopics(): { topicId: string; name: string; wordCount: number }[] {
  const counts = new Map<string, number>();
  for (const word of CATALOG_WORDS) {
    counts.set(word.topicId, (counts.get(word.topicId) ?? 0) + 1);
  }
  return [...counts.entries()].map(([topicId, wordCount]) => ({
    topicId,
    name: getTopicName(topicId),
    wordCount,
  }));
}

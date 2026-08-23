import type { Word } from "../../domain/models/Word";

export const MOCK_WORDS: Word[] = [
  { id: "food-jablko", term: "jabłko", translation: "яблуко", topicId: "food" },
  { id: "food-chleb", term: "chleb", translation: "хліб", topicId: "food" },
  { id: "food-woda", term: "woda", translation: "вода", topicId: "food" },
  { id: "food-ser", term: "ser", translation: "сир", topicId: "food" },
  { id: "food-mieso", term: "mięso", translation: "м'ясо", topicId: "food" },
  { id: "food-ryba", term: "ryba", translation: "риба", topicId: "food" },
  { id: "travel-lotnisko", term: "lotnisko", translation: "аеропорт", topicId: "travel" },
  { id: "travel-bagaz", term: "bagaż", translation: "багаж", topicId: "travel" },
  { id: "travel-bilet", term: "bilet", translation: "квиток", topicId: "travel" },
  { id: "travel-pociag", term: "pociąg", translation: "поїзд", topicId: "travel" },
  { id: "travel-hotel", term: "hotel", translation: "готель", topicId: "travel" },
  { id: "travel-mapa", term: "mapa", translation: "карта", topicId: "travel" },
];

export const KNOWN_TOPIC_IDS = new Set(MOCK_WORDS.map((word) => word.topicId));

export function getMockWords(): Word[] {
  return MOCK_WORDS;
}

export function getMockWordsByTopic(topicId: string): Word[] {
  return MOCK_WORDS.filter((word) => word.topicId === topicId);
}

import type { Word } from "../domain/models/Word";

export const DEFAULT_STUDENT_ID = "student-1";

export const TOPIC_NAMES: Record<string, string> = {
  travel: "Подорожі",
  food: "Їжа",
  "daily-life": "Побут",
};

/** Initial word counts per topic on first app initialization (issue #6). */
export const INITIAL_TOPIC_WORD_COUNTS: Record<keyof typeof TOPIC_NAMES, number> = {
  travel: 25,
  food: 15,
  "daily-life": 7,
};

export const CATALOG_WORDS: Word[] = [
  {
    id: "airport",
    term: "lotnisko",
    translation: "аеропорт",
    topicId: "travel",
  },
  {
    id: "boarding-pass",
    term: "karta pokładowa",
    translation: "посадковий талон",
    topicId: "travel"
  },
  {
    id: "departure",
    term: "odlot",
    translation: "відправлення",
    topicId: "travel"
  },
  {
    id: "arrival",
    term: "przylot",
    translation: "приліт",
    topicId: "travel"
  },
  {
    id: "luggage",
    term: "bagaż",
    translation: "багаж",
    topicId: "travel"
  },
  {
    id: "flight",
    term: "lot",
    translation: "рейс",
    topicId: "travel",
  },
  {
    id: "reservation",
    term: "rezerwacja",
    translation: "бронювання",
    topicId: "travel",
  },
  {
    id: "gate",
    term: "bramka",
    translation: "вихід на посадку",
    topicId: "travel",
  },
  {
    id: "passport",
    term: "paszport",
    translation: "паспорт",
    topicId: "travel",
  },
  {
    id: "train-station",
    term: "dworzec",
    translation: "вокзал",
    topicId: "travel",
  },
  {
    id: "hotel",
    term: "hotel",
    translation: "готель",
    topicId: "travel",
  },
  {
    id: "ticket",
    term: "bilet",
    translation: "квиток",
    topicId: "travel",
  },
  {
    id: "train",
    term: "pociąg",
    translation: "поїзд",
    topicId: "travel",
  },
  {
    id: "taxi",
    term: "taksówka",
    translation: "таксі",
    topicId: "travel",
  },
  {
    id: "map",
    term: "mapa",
    translation: "карта",
    topicId: "travel",
  },
  {
    id: "customs",
    term: "cło",
    translation: "митниця",
    topicId: "travel",
  },
  {
    id: "border",
    term: "granica",
    translation: "кордон",
    topicId: "travel",
  },
  {
    id: "delay",
    term: "opóźnienie",
    translation: "затримка",
    topicId: "travel",
  },
  {
    id: "platform",
    term: "peron",
    translation: "перон",
    topicId: "travel",
  },
  {
    id: "suitcase",
    term: "walizka",
    translation: "валіза",
    topicId: "travel",
  },
  {
    id: "destination",
    term: "cel",
    translation: "пункт призначення",
    topicId: "travel",
  },
  {
    id: "route",
    term: "trasa",
    translation: "маршрут",
    topicId: "travel",
  },
  {
    id: "seat",
    term: "miejsce",
    translation: "місце",
    topicId: "travel",
  },
  {
    id: "driver",
    term: "kierowca",
    translation: "водій",
    topicId: "travel",
  },
  {
    id: "bridge",
    term: "most",
    translation: "міст",
    topicId: "travel",
  },
  {
    id: "menu",
    term: "menu",
    translation: "меню",
    topicId: "food",
  },
  {
    id: "waiter",
    term: "kelner",
    translation: "офіціант",
    topicId: "food",
  },
  {
    id: "bill",
    term: "rachunek",
    translation: "рахунок",
    topicId: "food",
  },
  {
    id: "tip",
    term: "napiwek",
    translation: "чайові",
    topicId: "food",
  },
  {
    id: "reservation-food",
    term: "rezerwacja stolika",
    translation: "бронювання столика",
    topicId: "food",
  },
  {
    id: "dessert",
    term: "deser",
    translation: "десерт",
    topicId: "food",      
  },
  {
    id: "appetizer",
    term: "przystawka",
    translation: "закуска",
    topicId: "food",
  },
  {
    id: "order",
    term: "zamówić",
    translation: "замовити",
    topicId: "food",
  },
  {
    id: "spicy",
    term: "pikantny",
    translation: "гострий",
    topicId: "food",
  },
  {
    id: "delicious",
    term: "pyszny",
    translation: "смачний",
    topicId: "food",
  },
  {
    id: "soup",
    term: "zupa",
    translation: "суп",
    topicId: "food",
  },
  {
    id: "bread",
    term: "chleb",
    translation: "хліб",
    topicId: "food",
  },
  {
    id: "cheese",
    term: "ser",
    translation: "сир",
    topicId: "food",
  },
  {
    id: "coffee",
    term: "kawa",
    translation: "кава",
    topicId: "food",
  },
  {
    id: "water",
    term: "woda",
    translation: "вода",
    topicId: "food",
  },
  {
    id: "breakfast",
    term: "śniadanie",
    translation: "сніданок",
    topicId: "daily-life",
  },
  {
    id: "shopping",
    term: "zakupy",
    translation: "покупки",
    topicId: "daily-life",
  },
  {
    id: "transport",
    term: "transport",
    translation: "транспорт",
    topicId: "daily-life",
  },
  {
    id: "appointment",
    term: "wizyta",
    translation: "зустріч",
    topicId: "daily-life",
  },
  {
    id: "neighbor",
    term: "sąsiad",
    translation: "сусід",
    topicId: "daily-life",
  },
  {
    id: "schedule",
    term: "rozkład",
    translation: "розклад",
    topicId: "daily-life",
  },
  {
    id: "exercise",
    term: "ćwiczenie",
    translation: "вправа",
    topicId: "daily-life",
      },
];

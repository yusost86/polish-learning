import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import { DEFAULT_STUDENT_ID } from "../data/wordCatalog";
import { db } from "../db/database";
import { WordState } from "../domain/enums/WordState";
import { createEmptyWordProgress } from "../domain/models/WordProgress";
import { DexieLearningRepository } from "../repositories/DexieLearningRepository";
import { serializeWordProgress } from "../repositories/progressMapper";
import { createInitialCard } from "../services/FsrsService";
import { getUnlockedTopicWords } from "../services/WaveManager";
import GameScreen from "./GameScreen";
import MenuScreen from "./MenuScreen";
import StatisticsScreen from "./StatisticsScreen";
import TopicOverviewScreen from "./TopicOverviewScreen";
import WordsListScreen from "./WordsListScreen";

afterEach(cleanup);

async function seedTravelConsolidatingDueSession(now: Date, dueDate: Date): Promise<void> {
  const repo = new DexieLearningRepository();
  await repo.initialize();
  const unlockedTravel = getUnlockedTopicWords(
    await repo.getTopicWords("travel"),
    await repo.getUnlockedWaveCount(DEFAULT_STUDENT_ID, "travel"),
  );
  const matureWords = unlockedTravel.slice(0, 4);
  const consolidatingWords = unlockedTravel.slice(4);

  for (const word of matureWords) {
    const progress = createEmptyWordProgress(DEFAULT_STUDENT_ID, word.id, now, createInitialCard(now));
    progress.state = WordState.Mature;
    progress.totalAttempts = 5;
    progress.recognition.mastery = 0.9;
    progress.recall.mastery = 0.85;
    progress.production.mastery = 0.8;
    progress.context.mastery = 0.75;
    progress.fsrsCard = {
      ...progress.fsrsCard,
      due: dueDate,
      state: 2,
      reps: 2,
    };
    await db.studentWordProgress.put(serializeWordProgress(progress));
  }

  for (const word of consolidatingWords) {
    const progress = createEmptyWordProgress(DEFAULT_STUDENT_ID, word.id, now, createInitialCard(now));
    progress.state = WordState.Consolidating;
    progress.totalAttempts = 3;
    progress.recognition.mastery = 0.5;
    progress.recall.mastery = 0.45;
    progress.production.mastery = 0.4;
    progress.context.mastery = 0.35;
    progress.fsrsCard = {
      ...progress.fsrsCard,
      due: dueDate,
      state: 2,
      reps: 1,
    };
    await db.studentWordProgress.put(serializeWordProgress(progress));
  }
}

function renderApp(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<MenuScreen />} />
        <Route path="/game/:topicId" element={<GameScreen />} />
        <Route path="/game" element={<GameScreen />} />
        <Route path="/topic/:topicId" element={<TopicOverviewScreen />} />
        <Route path="/stats" element={<StatisticsScreen />} />
        <Route path="/words" element={<WordsListScreen />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("MenuScreen", () => {
  it("renders live stats, topics, and nav", async () => {
    renderApp();

    expect(screen.getByText("Словник")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Унікальних слів")).toBeInTheDocument();
      expect(screen.getAllByText("27").length).toBeGreaterThanOrEqual(1);
    });
    expect(screen.queryByRole("button", { name: /Повторити \d+ слів/ })).not.toBeInTheDocument();
    expect(screen.getByText("Їжа")).toBeInTheDocument();
    expect(screen.getByText("Подорожі")).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: "Вивчити: Їжа" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Вивчити: Подорожі" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Статистика/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Всі слова/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Повторити: Подорожі" })).not.toBeInTheDocument();
  });

  it("opens a learn session from a topic card", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Вивчити: Їжа" }));
    await waitFor(() => expect(screen.getByText("Розпізнавання")).toBeInTheDocument());
    expect(screen.getByText(/Вивчити нові/)).toBeInTheDocument();
    expect(screen.getByText("przystawka")).toBeInTheDocument();
  });

  it("keeps learn enabled and opens fallback session when only consolidating words remain", async () => {
    const now = new Date("2026-08-25T12:00:00.000Z");
    await seedTravelConsolidatingDueSession(now, new Date("2026-09-01T12:00:00.000Z"));

    renderApp();
    const learnButton = await screen.findByRole("button", { name: "Вивчити: Подорожі" });
    expect(learnButton).not.toBeDisabled();
    fireEvent.click(learnButton);
    await waitFor(() => expect(screen.getByText(/Вивчити нові/)).toBeInTheDocument());
    expect(screen.queryByText("Сесію завершено")).not.toBeInTheDocument();
    expect(screen.queryByText("0 вправи")).not.toBeInTheDocument();
  });

  it("opens learn session when consolidating words are FSRS due", async () => {
    const now = new Date("2026-08-25T12:00:00.000Z");
    await seedTravelConsolidatingDueSession(now, new Date("2026-08-22T12:00:00.000Z"));

    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Вивчити: Подорожі" }));
    await waitFor(() => expect(screen.getByText(/Вивчити нові/)).toBeInTheDocument());
    expect(screen.queryByText("Сесію завершено")).not.toBeInTheDocument();
    expect(screen.queryByText("0 вправи")).not.toBeInTheDocument();
  });

  it("opens stats and words stubs and returns home", async () => {
    renderApp();
    await screen.findByRole("button", { name: "Вивчити: Їжа" });
    fireEvent.click(screen.getByRole("button", { name: /Статистика/ }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Статистика" })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("До повторення")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Назад"));
    expect(screen.getByText("Словник")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Всі слова/ }));
    expect(screen.getByText("Теми та слова")).toBeInTheDocument();
  });
});

describe("TopicOverviewScreen", () => {
  it("starts a non-empty session from topic overview when words are FSRS due", async () => {
    const now = new Date("2026-08-25T12:00:00.000Z");
    await seedTravelConsolidatingDueSession(now, new Date("2026-08-22T12:00:00.000Z"));

    renderApp("/topic/travel");
    fireEvent.click(await screen.findByRole("button", { name: "Почати сесію" }));
    await waitFor(() => expect(screen.getByText(/Вивчити нові/)).toBeInTheDocument());
    expect(screen.queryByText("Сесію завершено")).not.toBeInTheDocument();
    expect(screen.queryByText("0 вправи")).not.toBeInTheDocument();
  });
});

describe("GameScreen", () => {
  it("saves progress after answering and advances to the next queue item", async () => {
    renderApp("/game/food?mode=new");
    await waitFor(() => expect(screen.getByText("przystawka")).toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "закуска" }));
    fireEvent.click(screen.getByRole("button", { name: "Далі" }));

    await waitFor(() => expect(screen.queryByText("przystawka")).not.toBeInTheDocument());

    const { initLearningEngine } = await import("../services/learningEngineProvider");
    const engine = await initLearningEngine();
    const progress = await engine.getWordProgress("student-1", "appetizer");
    expect(progress.totalAttempts).toBe(1);
  });

  it("shows empty state without mode", () => {
    renderApp("/game/food");
    expect(screen.getByText("Сесію не запущено")).toBeInTheDocument();
  });
});

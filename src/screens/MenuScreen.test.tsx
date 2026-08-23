import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it } from "vitest";

import GameScreen from "./GameScreen";
import MenuScreen from "./MenuScreen";
import StatisticsScreen from "./StatisticsScreen";
import WordsListScreen from "./WordsListScreen";

afterEach(cleanup);

function renderApp(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/" element={<MenuScreen />} />
        <Route path="/game/:topicId" element={<GameScreen />} />
        <Route path="/game" element={<GameScreen />} />
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
    expect(await screen.findByRole("button", { name: "Вивчити нові: Їжа" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Вивчити нові: Подорожі" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Статистика/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Всі слова/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Повторити: Подорожі" })).toBeDisabled();
  });

  it("does not open review session when topic repeat is disabled", async () => {
    renderApp();
    const repeatButton = await screen.findByRole("button", { name: "Повторити: Подорожі" });
    expect(repeatButton).toBeDisabled();
    fireEvent.click(repeatButton);
    expect(screen.getByText("Словник")).toBeInTheDocument();
    expect(screen.queryByText("Завантаження сесії…")).not.toBeInTheDocument();
  });

  it("opens a new-word session from a topic card", async () => {
    renderApp();
    fireEvent.click(await screen.findByRole("button", { name: "Вивчити нові: Їжа" }));
    await waitFor(() => expect(screen.getByText("Розпізнавання")).toBeInTheDocument());
    expect(screen.getByText(/Вивчити нові/)).toBeInTheDocument();
    expect(screen.getByText("przystawka")).toBeInTheDocument();
  });

  it("opens stats and words stubs and returns home", async () => {
    renderApp();
    await screen.findByRole("button", { name: "Вивчити нові: Їжа" });
    fireEvent.click(screen.getByRole("button", { name: /Статистика/ }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Статистика" })).toBeInTheDocument());
    await waitFor(() => expect(screen.getByText("До повторення")).toBeInTheDocument());

    fireEvent.click(screen.getByLabelText("Назад"));
    expect(screen.getByText("Словник")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Всі слова/ }));
    expect(screen.getByText("Теми та слова")).toBeInTheDocument();
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

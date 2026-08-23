import { describe, expect, it } from "vitest";
import { createEmptyCard, fsrs, Rating, State } from "ts-fsrs";

import { Grade } from "../domain/enums/Grade";
import { SLOW_THRESHOLD_MS } from "../domain/constants";
import {
  createInitialCard,
  formatFsrsStatus,
  gradeToRating,
  isDue,
  isNewCard,
  mapAnswerToGrade,
  overdueScore,
} from "./FsrsService";

const NOW = new Date("2026-08-23T12:00:00.000Z");

describe("FsrsService", () => {
  it("maps answer to grade per scenario contract", () => {
    expect(mapAnswerToGrade(false, 2000, 0)).toBe(Grade.Again);
    expect(mapAnswerToGrade(true, SLOW_THRESHOLD_MS + 100, 0)).toBe(Grade.Hard);
    expect(mapAnswerToGrade(true, 2000, 4)).toBe(Grade.Easy);
    expect(mapAnswerToGrade(true, 2000, 2)).toBe(Grade.Good);
  });

  it("maps grade to FSRS rating", () => {
    expect(gradeToRating(Grade.Again)).toBe(Rating.Again);
    expect(gradeToRating(Grade.Hard)).toBe(Rating.Hard);
    expect(gradeToRating(Grade.Good)).toBe(Rating.Good);
    expect(gradeToRating(Grade.Easy)).toBe(Rating.Easy);
  });

  it("detects overdue score capped at 1", () => {
    const card = createEmptyCard(new Date("2026-08-13T12:00:00.000Z"));
    card.state = State.Review;
    card.due = new Date("2026-08-13T12:00:00.000Z");
    expect(overdueScore(card, NOW)).toBe(1);
  });

  it("detects due and new cards", () => {
    const newCard = createInitialCard(NOW);
    expect(isNewCard(newCard)).toBe(true);
    expect(isDue(newCard, NOW)).toBe(true);

    const dueCard = createEmptyCard(NOW);
    dueCard.state = State.Review;
    dueCard.due = new Date("2026-08-23T10:00:00.000Z");
    expect(isDue(dueCard, NOW)).toBe(true);
    expect(formatFsrsStatus(dueCard, NOW)).toBe("Due");
  });

  it("schedules next review via FSRS", () => {
    const scheduler = fsrs({ enable_fuzz: false });
    const card = createInitialCard(NOW);
    const { card: nextCard } = scheduler.next(card, NOW, Rating.Good);
    expect(nextCard.due.getTime()).toBeGreaterThan(NOW.getTime());
  });
});

import { fsrs, type Card } from "ts-fsrs";
import { toFsrsRating } from "./fsrsAdapter";
import type { FsrsGrade } from "../types";

const scheduler = fsrs();
interface FsrsScheduleResult { card: Card; nextReviewAt: Date; grade: FsrsGrade; intervalDays: number; }

export function scheduleFsrsReview(card: Card, now: Date, grade: FsrsGrade): FsrsScheduleResult {
  const result = scheduler.next(card, now, toFsrsRating(grade));
  return { card: result.card, nextReviewAt: result.card.due, grade, intervalDays: (result.card.due.getTime() - now.getTime()) / 86_400_000 };
}

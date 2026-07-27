// src/learning/session-queue.ts

import type { StudentWord } from "../domain/types";

export class SessionQueue {
  private queue: StudentWord[] = [];

  constructor(cards: StudentWord[]) {
    this.queue = [...cards];
  }

  next(): StudentWord | undefined {
    return this.queue.shift();
  }

  requeueAfterError(card: StudentWord): void {
    const position = Math.min(3, this.queue.length);
    this.queue.splice(position, 0, card);
  }

  get length(): number {
    return this.queue.length;
  }
}

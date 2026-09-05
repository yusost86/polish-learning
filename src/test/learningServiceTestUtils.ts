import { beforeEach } from "vitest";

import { LocalLearningService } from "../application/LocalLearningService";
import { db } from "../db/database";

export let testLearningService: LocalLearningService;

export async function resetTestLearningService(): Promise<LocalLearningService> {
  await db.delete();
  await db.open();
  testLearningService = new LocalLearningService();
  await testLearningService.initializeForTests();
  return testLearningService;
}

beforeEach(async () => {
  await resetTestLearningService();
});

import "@testing-library/jest-dom/vitest";
import "fake-indexeddb/auto";
import { beforeEach } from "vitest";

import { initDexieLearningEngineForTests } from "../services/learningEngineProvider";

beforeEach(async () => {
  await initDexieLearningEngineForTests();
});

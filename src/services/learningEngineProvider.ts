import { DexieLearningRepository } from "../repositories/DexieLearningRepository";
import { InMemoryLearningRepository } from "../repositories/InMemoryLearningRepository";
import { db } from "../db/database";
import { CATALOG_WORDS } from "../data/wordCatalog";
import { LearningEngine } from "./LearningEngine";

let engine: LearningEngine | null = null;
let initPromise: Promise<LearningEngine> | null = null;

export function createInMemoryLearningEngine(): LearningEngine {
  return new LearningEngine(new InMemoryLearningRepository(CATALOG_WORDS));
}

export async function initLearningEngine(): Promise<LearningEngine> {
  if (engine) {
    return engine;
  }
  if (!initPromise) {
    initPromise = (async () => {
      const repository = new DexieLearningRepository();
      await repository.initialize();
      engine = new LearningEngine(repository);
      return engine;
    })();
  }
  return initPromise;
}

export function getLearningEngine(): LearningEngine {
  if (!engine) {
    throw new Error("Learning engine not initialized. Call initLearningEngine() first.");
  }
  return engine;
}

export function resetLearningEngineForTests(inMemory = true): LearningEngine {
  engine = inMemory
    ? createInMemoryLearningEngine()
    : new LearningEngine(new DexieLearningRepository());
  initPromise = Promise.resolve(engine);
  return engine;
}

export async function initDexieLearningEngineForTests(): Promise<LearningEngine> {
  engine = null;
  initPromise = null;
  await db.delete();
  await db.open();
  return initLearningEngine();
}

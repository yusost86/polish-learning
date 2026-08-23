import { DexieLearningRepository } from "../repositories/DexieLearningRepository";
import { InMemoryLearningRepository } from "../repositories/InMemoryLearningRepository";
import { db } from "../db/database";
import { CATALOG_WORDS } from "../data/wordCatalog";
import { setCatalogCache } from "../data/catalogProvider";
import { LearningEngine } from "./LearningEngine";
import { syncCatalogCache } from "./catalogSync";

let engine: LearningEngine | null = null;
let initPromise: Promise<LearningEngine> | null = null;

async function attachCatalogSync(instance: LearningEngine, repository: DexieLearningRepository | InMemoryLearningRepository): Promise<LearningEngine> {
  await syncCatalogCache(repository, setCatalogCache);
  return instance;
}

export function createInMemoryLearningEngine(): LearningEngine {
  const repository = new InMemoryLearningRepository(CATALOG_WORDS);
  void syncCatalogCache(repository, setCatalogCache);
  return new LearningEngine(repository);
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
      await attachCatalogSync(engine, repository);
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
  const repository = inMemory
    ? new InMemoryLearningRepository(CATALOG_WORDS)
    : new DexieLearningRepository();
  engine = new LearningEngine(repository);
  initPromise = Promise.resolve(engine);
  void syncCatalogCache(repository, setCatalogCache);
  return engine;
}

export async function initDexieLearningEngineForTests(): Promise<LearningEngine> {
  engine = null;
  initPromise = null;
  await db.delete();
  await db.open();
  return initLearningEngine();
}

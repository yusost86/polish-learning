import { DexieLearningRepository } from "../repositories/DexieLearningRepository";
import { db } from "../db/database";
import { setCatalogCache } from "../data/catalogProvider";
import { LearningEngine } from "./LearningEngine";
import { syncCatalogCache } from "./catalogSync";

let engine: LearningEngine | null = null;
let repository: DexieLearningRepository | null = null;
let initPromise: Promise<LearningEngine> | null = null;

export async function initLearningRepository(): Promise<DexieLearningRepository> {
  if (repository) {
    return repository;
  }

  repository = new DexieLearningRepository();
  await repository.initialize();
  await syncCatalogCache(repository, setCatalogCache);
  return repository;
}

export async function initLearningEngine(): Promise<LearningEngine> {
  if (engine) {
    return engine;
  }

  if (!initPromise) {
    initPromise = (async () => {
      const repo = await initLearningRepository();
      engine = new LearningEngine(repo);
      return engine;
    })();
  }

  return initPromise;
}

export async function initDexieLearningEngineForTests(): Promise<LearningEngine> {
  engine = null;
  repository = null;
  initPromise = null;
  await db.delete();
  await db.open();
  return initLearningEngine();
}

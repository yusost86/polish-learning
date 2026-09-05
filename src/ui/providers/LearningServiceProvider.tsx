import { createContext, useContext, type ReactNode } from "react";

import type { LearningService } from "../../application/LearningService";

const LearningServiceContext = createContext<LearningService | null>(null);

export interface LearningServiceProviderProps {
  service: LearningService;
  children: ReactNode;
}

export function LearningServiceProvider({ service, children }: LearningServiceProviderProps) {
  return (
    <LearningServiceContext.Provider value={service}>{children}</LearningServiceContext.Provider>
  );
}

export function useLearningServiceContext(): LearningService {
  const service = useContext(LearningServiceContext);
  if (!service) {
    throw new Error("useLearningService must be used within LearningServiceProvider");
  }
  return service;
}

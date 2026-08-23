import type { SessionMode } from "../domain/enums/SessionMode";

export interface GetNextTasksParams {
  topicId?: string;
  mode?: SessionMode;
  /** Max queue size. Defaults to session size (10). */
  limit?: number;
}

export type GetNextTasksInput = string | GetNextTasksParams;

export function normalizeGetNextTasksInput(input?: GetNextTasksInput): GetNextTasksParams {
  if (typeof input === "string") {
    return { topicId: input };
  }
  return input ?? {};
}

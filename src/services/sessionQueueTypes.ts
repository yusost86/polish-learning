import type { SessionMode } from "../domain/enums/SessionMode";

export interface GetNextTasksParams {
  topicId?: string;
  mode?: SessionMode;
}

export type GetNextTasksInput = string | GetNextTasksParams;

export function normalizeGetNextTasksInput(input?: GetNextTasksInput): GetNextTasksParams {
  if (typeof input === "string") {
    return { topicId: input };
  }
  return input ?? {};
}

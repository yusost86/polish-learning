
export interface GetNextTasksParams {
  topicId?: string;
}


export function normalizeGetNextTasksInput(input?: GetNextTasksParams): GetNextTasksParams {
  if (typeof input === "string") {
    return { topicId: input };
  }
  return input ?? {};
}

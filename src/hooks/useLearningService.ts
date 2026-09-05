import { useLearningServiceContext } from "../ui/providers/LearningServiceProvider";

export function useLearningService() {
  return useLearningServiceContext();
}

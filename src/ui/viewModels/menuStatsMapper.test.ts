import { describe, expect, it } from "vitest";

import {
  getTopicPrimaryAction,
  getTopicProgressPct,
  toTopicStatViewModel,
} from "./menuStatsMapper";

describe("menuStatsMapper", () => {
  describe("getTopicProgressPct", () => {
    it("returns 0 when total is 0", () => {
      expect(getTopicProgressPct(0, 0)).toBe(0);
    });

    it("rounds learned/total to percentage", () => {
      expect(getTopicProgressPct(8, 10)).toBe(80);
      expect(getTopicProgressPct(9, 10)).toBe(90);
    });
  });

  describe("getTopicPrimaryAction", () => {
    it("returns learn below 90%", () => {
      expect(getTopicPrimaryAction(0)).toBe("learn");
      expect(getTopicPrimaryAction(89)).toBe("learn");
    });

    it("returns review at or above 90%", () => {
      expect(getTopicPrimaryAction(90)).toBe("review");
      expect(getTopicPrimaryAction(100)).toBe("review");
    });
  });

  describe("toTopicStatViewModel", () => {
    it("maps topic stats with progress and primary action", () => {
      const viewModel = toTopicStatViewModel({
        topicId: "food",
        total: 10,
        learned: 8,
        due: 2,
        new: 1,
      });

      expect(viewModel).toMatchObject({
        topicId: "food",
        name: "Їжа",
        total: 10,
        learned: 8,
        due: 2,
        new: 1,
        progressPct: 80,
        primaryAction: "learn",
      });
    });

    it("switches to review at 90% progress", () => {
      const viewModel = toTopicStatViewModel({
        topicId: "food",
        total: 10,
        learned: 9,
        due: 1,
        new: 0,
      });

      expect(viewModel.progressPct).toBe(90);
      expect(viewModel.primaryAction).toBe("review");
    });
  });
});

import { describe, expect, it } from "vitest";

import {
  getTopicProgressPct,
  toTopicStatViewModel,
} from "../../../ui/viewModels/menuStatsMapper";

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

  describe("toTopicStatViewModel", () => {
    it("maps topic stats with progress", () => {
      const viewModel = toTopicStatViewModel({
        topicId: "food",
        total: 10,
        learned: 8,
        due: 2,
        new: 1,
        learnable: 3,
      });

      expect(viewModel).toMatchObject({
        topicId: "food",
        name: "Їжа",
        total: 10,
        learned: 8,
        due: 2,
        new: 1,
        learnable: 3,
        progressPct: 80,
      });
    });

    it("calculates progress at 90%", () => {
      const viewModel = toTopicStatViewModel({
        topicId: "food",
        total: 10,
        learned: 9,
        due: 1,
        new: 0,
        learnable: 0,
      });

      expect(viewModel.progressPct).toBe(90);
    });
  });
});

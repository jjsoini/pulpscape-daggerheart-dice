import create from "zustand";
import { immer } from "zustand/middleware/immer";
import { Advantage, DiceCounts } from "./store";
import { Die } from "../types/Die";
import { generateDiceId } from "../helpers/generateDiceId";
import { DualityResult } from "../helpers/getDualityResult";

/** What was picked for a roll, enough to roll it again */
export interface RollPick {
  counts: DiceCounts;
  advantage: Advantage;
  bonus: number;
  diceById: Record<string, Die>;
}

/** The final result of a roll */
export interface RollResult {
  value: number | null;
  duality: DualityResult | null;
}

export interface RecentRoll extends RollPick {
  /** Unique id so the result can be attached once the dice settle */
  id: string;
  /** `null` while rolling */
  result: RollResult | null;
}

/** How many rolls the history keeps */
const MAX_ROLLS = 6;

interface DiceHistoryState {
  recentRolls: RecentRoll[];
  /** The history entry that the current roll in the tray belongs to */
  activeRollId: string | null;
  pushRecentRoll: (roll: RollPick) => void;
  removeRecentRoll: (index: number) => void;
  setActiveRollResult: (result: RollResult | null) => void;
}

export const useDiceHistoryStore = create<DiceHistoryState>()(
  immer((set) => ({
    recentRolls: [],
    activeRollId: null,
    pushRecentRoll(roll) {
      set((state) => {
        if (state.recentRolls.length >= MAX_ROLLS) {
          state.recentRolls.splice(0, 1);
        }
        const id = generateDiceId();
        state.recentRolls.push({ ...roll, id, result: null });
        state.activeRollId = id;
      });
    },
    removeRecentRoll(index) {
      set((state) => {
        state.recentRolls.splice(index, 1);
      });
    },
    setActiveRollResult(result) {
      set((state) => {
        const roll = state.recentRolls.find((r) => r.id === state.activeRollId);
        if (roll) {
          roll.result = result;
        }
      });
    },
  }))
);

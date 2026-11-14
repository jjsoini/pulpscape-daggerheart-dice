import create from "zustand";
import { immer } from "zustand/middleware/immer";
import {
  diceSets,
  DUALITY_ID,
  FEAR_STYLE,
  HOPE_STYLE,
} from "../sets/diceSets";
import { Dice } from "../types/Dice";
import { DiceSet } from "../types/DiceSet";
import { Die } from "../types/Die";
import { generateDiceId } from "../helpers/generateDiceId";

export type Advantage = "ADVANTAGE" | "DISADVANTAGE" | null;
export type DiceCounts = Record<string, number>;

interface DiceControlsState {
  diceSet: DiceSet;
  diceById: Record<string, Die>;
  defaultDiceCounts: DiceCounts;
  diceCounts: DiceCounts;
  diceAdvantage: Advantage;
  /** Modifier added to the Duality Dice total */
  diceBonus: number;
  diceHidden: boolean;
  diceRollPressTime: number | null;
  changeDiceSet: (diceSet: DiceSet) => void;
  resetDiceCounts: () => void;
  changeDieCount: (id: string, count: number) => void;
  incrementDieCount: (id: string) => void;
  decrementDieCount: (id: string) => void;
  setDiceAdvantage: (advantage: Advantage) => void;
  setDiceBonus: (bonus: number) => void;
  toggleDiceHidden: () => void;
  setDiceRollPressTime: (time: number | null) => void;
}

const initialSet = diceSets[0];
const initialDiceCounts = getDiceCountsFromSet(initialSet);
const initialDiceById = getDiceByIdFromSet(initialSet);

export const useDiceControlsStore = create<DiceControlsState>()(
  immer((set) => ({
    diceSet: initialSet,
    diceById: initialDiceById,
    defaultDiceCounts: initialDiceCounts,
    diceCounts: initialDiceCounts,
    diceAdvantage: null,
    diceBonus: 0,
    diceHidden: false,
    diceRollPressTime: null,
    changeDiceSet(diceSet) {
      set((state) => {
        const counts: DiceCounts = {};
        const prevCounts = state.diceCounts;
        const prevDice = state.diceSet.dice;
        for (let i = 0; i < diceSet.dice.length; i++) {
          const die = diceSet.dice[i];
          const prevDie = prevDice[i];
          // Carry over count if the index and die type match
          if (prevDie && prevDie.type === die.type) {
            counts[die.id] = prevCounts[prevDie.id] || 0;
          } else {
            counts[die.id] = 0;
          }
        }
        state.diceCounts = counts;
        state.diceSet = diceSet;
        state.defaultDiceCounts = getDiceCountsFromSet(diceSet);
        state.diceById = getDiceByIdFromSet(diceSet);
      });
    },
    resetDiceCounts() {
      set((state) => {
        state.diceCounts = state.defaultDiceCounts;
      });
    },
    changeDieCount(id, count) {
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] = count;
        }
      });
    },
    incrementDieCount(id) {
      set((state) => {
        if (id in state.diceCounts) {
          if (id === DUALITY_ID) {
            // Only one pair of Duality Dice per roll
            state.diceCounts[id] = 1;
          } else {
            state.diceCounts[id] += 1;
          }
        }
      });
    },
    decrementDieCount(id) {
      set((state) => {
        if (id in state.diceCounts) {
          state.diceCounts[id] -= 1;
        }
      });
    },
    setDiceBonus(bonus) {
      set((state) => {
        state.diceBonus = bonus;
      });
    },
    setDiceAdvantage(advantage) {
      set((state) => {
        state.diceAdvantage = advantage;
      });
    },
    toggleDiceHidden() {
      set((state) => {
        state.diceHidden = !state.diceHidden;
      });
    },
    setDiceRollPressTime(time) {
      set((state) => {
        state.diceRollPressTime = time;
      });
    },
  }))
);

function getDiceCountsFromSet(diceSet: DiceSet) {
  const counts: Record<string, number> = {};
  for (const die of diceSet.dice) {
    counts[die.id] = 0;
  }
  return counts;
}

function getDiceByIdFromSet(diceSet: DiceSet) {
  const byId: Record<string, Die> = {};
  for (const die of diceSet.dice) {
    byId[die.id] = die;
  }
  return byId;
}

/**
 * Generate new dice based off of a set of counts and advantage.
 * The Duality Dice become one group: a Hope d12, a Fear d12 and, with
 * advantage or disadvantage, a d6 that is added or subtracted.
 * Advantage only applies to the Duality Dice, and so does `bonus` here:
 * `rollDicePool` puts the modifier for other dice on the whole roll.
 */
export function getDiceToRoll(
  counts: DiceCounts,
  advantage: Advantage,
  diceById: Record<string, Die>,
  bonus: number = 0
) {
  const dice: (Die | Dice)[] = [];
  for (const [id, count] of Object.entries(counts)) {
    const die = diceById[id];
    if (!die || count < 1) {
      continue;
    }

    if (id === DUALITY_ID) {
      const duality: Die[] = [
        { id: generateDiceId(), style: HOPE_STYLE, type: "D12", role: "HOPE" },
        { id: generateDiceId(), style: FEAR_STYLE, type: "D12", role: "FEAR" },
      ];
      if (advantage === "ADVANTAGE") {
        duality.push({
          id: generateDiceId(),
          style: HOPE_STYLE,
          type: "D6",
          role: "ADVANTAGE",
        });
      } else if (advantage === "DISADVANTAGE") {
        duality.push({
          id: generateDiceId(),
          style: FEAR_STYLE,
          type: "D6",
          role: "DISADVANTAGE",
        });
      }
      // Leave out a zero bonus so the breakdown doesn't show it
      dice.push(bonus !== 0 ? { dice: duality, bonus } : { dice: duality });
      continue;
    }

    const { style, type } = die;
    for (let i = 0; i < count; i++) {
      dice.push({ id: generateDiceId(), style, type });
    }
  }
  return dice;
}

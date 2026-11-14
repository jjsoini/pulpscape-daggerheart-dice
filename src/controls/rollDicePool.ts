import { useDiceRollStore } from "../dice/store";
import { getDiceToRoll, useDiceControlsStore } from "./store";
import { DUALITY_ID } from "../sets/diceSets";

/** Clear the picked dice, advantage and modifier */
export function resetDicePool() {
  const controls = useDiceControlsStore.getState();
  controls.resetDiceCounts();
  controls.setDiceAdvantage(null);
  controls.setDiceBonus(0);
}

/**
 * Roll the picked dice into the tray
 * @param speedMultiplier How hard to throw, from how long the roll was held
 */
export function rollDicePool(speedMultiplier?: number) {
  const {
    diceCounts: counts,
    diceById,
    diceHidden: hidden,
    diceAdvantage: advantage,
    diceBonus: bonus,
  } = useDiceControlsStore.getState();
  const dice = getDiceToRoll(counts, advantage, diceById, bonus);
  // The Duality Dice group carries the modifier itself, other dice get it on
  // the whole roll (left out when it's 0, so the breakdown doesn't show it)
  const hasDuality = (counts[DUALITY_ID] || 0) > 0;
  const rollBonus = !hasDuality && bonus !== 0 ? { bonus } : {};
  useDiceRollStore
    .getState()
    .startRoll({ dice, hidden, ...rollBonus }, speedMultiplier);
  resetDicePool();
}

/** Throw speed from how long the roll button was held */
export function getThrowSpeed(pressTime: number | null) {
  if (pressTime === null) {
    return 1;
  }
  const seconds = (performance.now() - pressTime) / 1000;
  return Math.max(1, Math.min(10, seconds * 2));
}

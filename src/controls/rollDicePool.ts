import { useDiceRollStore } from "../dice/store";
import { getDiceToRoll, useDiceControlsStore } from "./store";
import { DUALITY_ID } from "../sets/diceSets";
import { RollPick, useDiceHistoryStore } from "./history";

/** Clear the picked dice, advantage and modifier */
export function resetDicePool() {
  const controls = useDiceControlsStore.getState();
  controls.resetDiceCounts();
  controls.setDiceAdvantage(null);
  controls.setDiceBonus(0);
}

/**
 * Roll the picked dice into the tray and add them to the history
 * @param speedMultiplier How hard to throw, from how long the roll was held
 */
export function rollDicePool(speedMultiplier?: number) {
  const {
    diceCounts: counts,
    diceById,
    diceAdvantage: advantage,
    diceBonus: bonus,
  } = useDiceControlsStore.getState();
  rollPick({ counts, diceById, advantage, bonus }, speedMultiplier);
  resetDicePool();
}

/**
 * Roll a pick of dice into the tray (the picked pool, or a roll from the
 * history) and add it to the history
 */
export function rollPick(pick: RollPick, speedMultiplier?: number) {
  const { counts, diceById, advantage, bonus } = pick;
  const hidden = useDiceControlsStore.getState().diceHidden;
  const dice = getDiceToRoll(counts, advantage, diceById, bonus);
  // The Duality Dice group carries the modifier itself, other dice get it on
  // the whole roll (left out when it's 0, so the breakdown doesn't show it)
  const hasDuality = (counts[DUALITY_ID] || 0) > 0;
  const rollBonus = !hasDuality && bonus !== 0 ? { bonus } : {};
  useDiceRollStore
    .getState()
    .startRoll({ dice, hidden, ...rollBonus }, speedMultiplier);

  // Only the picked dice, and advantage only matters for the Duality Dice
  const picked: RollPick = {
    counts: {},
    diceById: {},
    advantage: hasDuality ? advantage : null,
    bonus,
  };
  for (const [id, count] of Object.entries(counts)) {
    if (count > 0 && diceById[id]) {
      picked.counts[id] = count;
      picked.diceById[id] = diceById[id];
    }
  }
  useDiceHistoryStore.getState().pushRecentRoll(picked);
}

/**
 * Reroll the whole roll in the tray as a new roll in the history. (Throwing
 * a single die again only changes the roll it belongs to.)
 */
export function rerollAll() {
  const history = useDiceHistoryStore.getState();
  const active = history.recentRolls.find(
    (roll) => roll.id === history.activeRollId
  );
  if (active) {
    const { counts, diceById, advantage, bonus } = active;
    history.pushRecentRoll({ counts, diceById, advantage, bonus });
  }
  useDiceRollStore.getState().reroll();
}

/** Throw speed from how long the roll button was held */
export function getThrowSpeed(pressTime: number | null) {
  if (pressTime === null) {
    return 1;
  }
  const seconds = (performance.now() - pressTime) / 1000;
  return Math.max(1, Math.min(10, seconds * 2));
}

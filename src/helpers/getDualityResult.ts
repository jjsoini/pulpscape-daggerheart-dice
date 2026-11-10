import { Dice, isDice } from "../types/Dice";
import { Die, DieRole, isDie } from "../types/Die";

export type DualityResult = "HOPE" | "FEAR" | "CRITICAL";

function findDieWithRole(dice: Dice, role: DieRole): Die | null {
  for (const dieOrDice of dice.dice) {
    if (isDie(dieOrDice) && dieOrDice.role === role) {
      return dieOrDice;
    } else if (isDice(dieOrDice)) {
      const die = findDieWithRole(dieOrDice, role);
      if (die) {
        return die;
      }
    }
  }
  return null;
}

/**
 * Read the Duality Dice of a roll: the higher of the Hope and Fear die
 * decides if the roll is with Hope or with Fear, and matching dice are a
 * critical success. Returns null if the roll has no Duality Dice or they
 * haven't finished rolling.
 */
export function getDualityResult(
  dice: Dice,
  values: Record<string, number>
): DualityResult | null {
  const hope = findDieWithRole(dice, "HOPE");
  const fear = findDieWithRole(dice, "FEAR");
  if (!hope || !fear) {
    return null;
  }
  const hopeValue = values[hope.id];
  const fearValue = values[fear.id];
  if (hopeValue === undefined || fearValue === undefined) {
    return null;
  }
  if (hopeValue === fearValue) {
    return "CRITICAL";
  }
  return hopeValue > fearValue ? "HOPE" : "FEAR";
}

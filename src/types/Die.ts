import { isPlainObject } from "is-plain-object";

import { DiceStyle } from "./DiceStyle";
import { DiceType } from "./DiceType";

/**
 * What a die means in a Daggerheart roll.
 * HOPE and FEAR are the Duality Dice, ADVANTAGE adds a d6 and
 * DISADVANTAGE subtracts a d6. Plain dice have no role.
 */
export type DieRole = "HOPE" | "FEAR" | "ADVANTAGE" | "DISADVANTAGE";

export interface Die {
  id: string;
  style: DiceStyle;
  type: DiceType;
  role?: DieRole;
}

export function isDie(value: any): value is Die {
  return isPlainObject(value) && typeof value.id === "string";
}

import { DiceSet } from "../types/DiceSet";
import { DiceStyle } from "../types/DiceStyle";

import * as gemstonePreviews from "../previews/gemstone";
import * as sunrisePreviews from "../previews/sunrise";

/** Picker id of the Duality Dice button (a Hope d12 and a Fear d12) */
export const DUALITY_ID = "DUALITY";

/** Dice styles for the Duality Dice and the advantage / disadvantage d6 */
export const HOPE_STYLE: DiceStyle = "SUNRISE";
export const FEAR_STYLE: DiceStyle = "GEMSTONE";

const setPreviews: Record<DiceStyle, string> = {
  SUNRISE: sunrisePreviews.D20,
  GEMSTONE: gemstonePreviews.D20,
};

/**
 * A set is the Duality Dice button followed by plain dice in the set's style.
 * The Duality Dice look the same in every set.
 */
function createSet(style: DiceStyle, name: string): DiceSet {
  const id = `${style}_SET`;
  return {
    id,
    name,
    dice: [
      { id: DUALITY_ID, type: "D12", style: HOPE_STYLE },
      { id: `${id}_D4`, type: "D4", style },
      { id: `${id}_D6`, type: "D6", style },
      { id: `${id}_D8`, type: "D8", style },
      { id: `${id}_D10`, type: "D10", style },
      { id: `${id}_D12`, type: "D12", style },
      { id: `${id}_D20`, type: "D20", style },
    ],
    previewImage: setPreviews[style],
  };
}

export const diceSets: DiceSet[] = [
  createSet(HOPE_STYLE, "Hope dice"),
  createSet(FEAR_STYLE, "Fear dice"),
];

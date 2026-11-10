import { DiceStyle } from "../types/DiceStyle";
import { GemstoneMaterial } from "./gemstone/GemstoneMaterial";
import { SunriseMaterial } from "./sunrise/SunriseMaterial";

export function DiceMaterial({ diceStyle }: { diceStyle: DiceStyle }) {
  switch (diceStyle) {
    case "SUNRISE":
      return <SunriseMaterial />;
    case "GEMSTONE":
      return <GemstoneMaterial />;
    default:
      throw Error(`Dice style ${diceStyle} error: not implemented`);
  }
}

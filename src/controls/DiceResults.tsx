import { useEffect, useMemo, useState } from "react";

import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Grow from "@mui/material/Grow";
import Fade from "@mui/material/Fade";
import Button from "@mui/material/Button";
import Tooltip from "@mui/material/Tooltip";

import { getCombinedDiceValue } from "../helpers/getCombinedDiceValue";
import { getDieFromDice } from "../helpers/getDieFromDice";
import {
  DualityResult,
  getDualityResult,
} from "../helpers/getDualityResult";
import { DiceRoll } from "../types/DiceRoll";
import { Die, isDie } from "../types/Die";
import { Dice, isDice } from "../types/Dice";
import { DicePreview } from "../previews/DicePreview";

export function DiceResults({
  diceRoll,
  rollValues,
  expanded,
  onExpand,
}: {
  diceRoll: DiceRoll;
  rollValues: Record<string, number>;
  expanded: boolean;
  onExpand: (expand: boolean) => void;
}) {
  const finalValue = useMemo(() => {
    return getCombinedDiceValue(diceRoll, rollValues);
  }, [diceRoll, rollValues]);

  const duality = useMemo(() => {
    return getDualityResult(diceRoll, rollValues);
  }, [diceRoll, rollValues]);

  // Hold the result back for a moment so players read the dice first.
  // Keyed on the dice ids (new on every roll and reroll) because synced
  // rolls from other players arrive as new objects on every OBR update.
  const rollKey = useMemo(
    () =>
      getDieFromDice(diceRoll)
        .map((die) => die.id)
        .join(","),
    [diceRoll]
  );
  const [shown, setShown] = useState(false);
  useEffect(() => {
    setShown(false);
    const timeout = setTimeout(() => setShown(true), RESULT_DELAY);
    return () => clearTimeout(timeout);
  }, [rollKey]);

  // The result sits at the bottom of the tray in a faint colour: the dice
  // themselves are the main read, the total is just there to help.
  // The breakdown opens upwards from it.
  return (
    <Fade in={shown}>
      <Stack alignItems="center" maxHeight="calc(100vh - 100px)">
        <Grow
          in={expanded}
          mountOnEnter
          unmountOnExit
          style={{ transformOrigin: "50% 100% 0" }}
        >
          <Stack overflow="auto" sx={{ pointerEvents: "all" }} mb={1}>
            <DiceResultsExpanded diceRoll={diceRoll} rollValues={rollValues} />
          </Stack>
        </Grow>
        <Tooltip
          title={expanded ? "Hide Breakdown" : "Show Breakdown"}
          disableInteractive
        >
          <Button
            sx={{
              pointerEvents: "all",
              padding: 0.5,
              paddingX: 1.5,
              minWidth: "40px",
              borderRadius: "20px",
              color: RESULT_COLOR,
            }}
            onClick={() => onExpand(!expanded)}
          >
            <Stack direction="row" alignItems="baseline" gap={1}>
              <Typography variant="h5" color="inherit">
                {finalValue}
              </Typography>
              {duality && (
                <Typography
                  variant="subtitle2"
                  color="inherit"
                  letterSpacing="0.08em"
                >
                  {dualityLabels[duality]}
                </Typography>
              )}
            </Stack>
          </Button>
        </Tooltip>
      </Stack>
    </Fade>
  );
}

const RESULT_COLOR = "rgba(255, 255, 255, 0.6)";
/** Milliseconds between the dice settling and the result appearing */
const RESULT_DELAY = 1000;

const dualityLabels: Record<DualityResult, string> = {
  HOPE: "WITH HOPE",
  FEAR: "WITH FEAR",
  CRITICAL: "CRITICAL SUCCESS",
};

/** The operator shown before a die in the breakdown */
function operatorBefore(die: Die, dice: Dice) {
  return die.role === "DISADVANTAGE" ? "−" : combination(dice);
}

function combination(dice: Dice) {
  if (dice.combination === "HIGHEST") {
    return ">";
  } else if (dice.combination === "LOWEST") {
    return "<";
  } else if (dice.combination === "NONE") {
    return ",";
  } else {
    return "+";
  }
}

function sortDice(
  die: Die[],
  rollValues: Record<string, number>,
  combination: "HIGHEST" | "LOWEST" | "SUM" | "NONE" | undefined
) {
  return die.sort((a, b) => {
    const aValue = rollValues[a.id];
    const bValue = rollValues[b.id];
    if (combination === "HIGHEST") {
      return bValue - aValue;
    } else if (combination === "LOWEST") {
      return aValue - bValue;
    } else {
      return 0;
    }
  });
}

function DiceResultsExpanded({
  diceRoll,
  rollValues,
}: {
  diceRoll: DiceRoll;
  rollValues: Record<string, number>;
}) {
  const die = useMemo(
    () =>
      sortDice(diceRoll.dice.filter(isDie), rollValues, diceRoll.combination),
    [diceRoll, rollValues]
  );
  const dice = useMemo(() => diceRoll.dice.filter(isDice), [diceRoll]);

  return (
    <Stack divider={<Divider />} gap={1}>
      <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center">
        {die.map((d, i) => (
          <Stack direction="row" key={d.id} gap={1}>
            <DicePreview diceStyle={d.style} diceType={d.type} size="small" />
            <Typography lineHeight="28px" color="white">
              {rollValues[d.id]}
            </Typography>
            {i < die.length - 1 && (
              <Typography lineHeight="28px" color="white">
                {operatorBefore(die[i + 1], diceRoll)}
              </Typography>
            )}
          </Stack>
        ))}
        {die.length > 0 && (
          <>
            <Typography lineHeight="28px" color="white">
              =
            </Typography>
            <Typography lineHeight="28px" color="white">
              {getCombinedDiceValue(
                { dice: die, combination: diceRoll.combination },
                rollValues
              )}
            </Typography>
          </>
        )}
      </Stack>
      {dice.map((d, i) => (
        <DiceResultsExpanded key={i} diceRoll={d} rollValues={rollValues} />
      ))}
      {diceRoll.bonus && (
        <Typography textAlign="center" lineHeight="28px" color="white">
          {diceRoll.bonus > 0 && "+"}
          {diceRoll.bonus}
        </Typography>
      )}
    </Stack>
  );
}

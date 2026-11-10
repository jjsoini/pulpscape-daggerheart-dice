import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { DicePreview } from "../previews/DicePreview";
import { DUALITY_ID, FEAR_STYLE, HOPE_STYLE } from "../sets/diceSets";
import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";

/** The Hope and Fear d12 drawn overlapping */
function DualityPreview() {
  return (
    <Box component="div" sx={{ position: "relative", width: 38, height: 38 }}>
      <Box component="div" sx={{ position: "absolute", left: -2, top: -2 }}>
        <DicePreview diceStyle={HOPE_STYLE} diceType="D12" size="small" />
      </Box>
      <Box
        component="div"
        sx={{ position: "absolute", right: -2, bottom: -2 }}
      >
        <DicePreview diceStyle={FEAR_STYLE} diceType="D12" size="small" />
      </Box>
    </Box>
  );
}

export function DicePicker() {
  const counts = useDiceControlsStore((state) => state.diceCounts);

  const diceById = useDiceControlsStore((state) => state.diceById);
  const handleDiceCountIncrease = useDiceControlsStore(
    (state) => state.incrementDieCount
  );
  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const roll = useDiceRollStore((state) => state.roll);
  function clearRollIfNeeded() {
    if (roll) {
      clearRoll();
    }
  }

  // The Duality Dice are rolled on their own: picking them disables the
  // other dice and picking other dice disables the Duality Dice
  const dualityPicked = (counts[DUALITY_ID] || 0) > 0;
  const otherPicked = Object.entries(counts).some(
    ([id, count]) => id !== DUALITY_ID && count > 0
  );

  return (
    <>
      {Object.entries(counts).map(([id, count]) => {
        const die = diceById[id];
        if (!die) {
          return null;
        }

        const isDuality = id === DUALITY_ID;
        const disabled = isDuality ? otherPicked : dualityPicked;

        const button = (
          <IconButton
            onClick={() => {
              handleDiceCountIncrease(id);
              clearRollIfNeeded();
            }}
            disabled={disabled}
            sx={{ p: 0, opacity: disabled ? 0.3 : 1 }}
          >
            {isDuality ? (
              <DualityPreview />
            ) : (
              <DicePreview diceStyle={die.style} diceType={die.type} />
            )}
          </IconButton>
        );

        return (
          <Badge
            // The Duality Dice are on or off, so no count for them
            badgeContent={isDuality ? 0 : count}
            sx={{
              ".MuiBadge-badge": {
                bgcolor: "background.default",
                backgroundImage:
                  "linear-gradient(rgba(255, 255, 255, 0.30), rgba(255, 255, 255, 0.30))",
                pointerEvents: "none",
              },
            }}
            overlap="circular"
            key={id}
          >
            {isDuality ? (
              <Tooltip
                title="Duality Dice"
                placement="right"
                disableInteractive
              >
                <span>{button}</span>
              </Tooltip>
            ) : (
              button
            )}
          </Badge>
        );
      })}
    </>
  );
}

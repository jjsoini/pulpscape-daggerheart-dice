import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { DicePreview } from "../previews/DicePreview";
import { DUALITY_ID, FEAR_STYLE, HOPE_STYLE } from "../sets/diceSets";
import { useDiceControlsStore } from "./store";
import { useDiceRollStore } from "../dice/store";
import { Die } from "../types/Die";

/**
 * The Hope and Fear d12 drawn overlapping
 * @param fill Fill its container (the panel buttons), else 38 px
 */
function DualityPreview({ fill = false }: { fill?: boolean }) {
  // Each die covers this share of the button, offset to opposite corners
  const share = fill ? "68%" : undefined;
  return (
    <Box
      component="div"
      sx={{
        position: "relative",
        width: fill ? "100%" : 38,
        height: fill ? "100%" : 38,
      }}
    >
      <Box
        component="div"
        sx={
          fill
            ? { position: "absolute", left: "4%", top: "4%", width: share }
            : { position: "absolute", left: -2, top: -2 }
        }
      >
        <DicePreview
          diceStyle={HOPE_STYLE}
          diceType="D12"
          size={fill ? "fill" : "small"}
        />
      </Box>
      <Box
        component="div"
        sx={
          fill
            ? { position: "absolute", right: "4%", bottom: "4%", width: share }
            : { position: "absolute", right: -2, bottom: -2 }
        }
      >
        <DicePreview
          diceStyle={FEAR_STYLE}
          diceType="D12"
          size={fill ? "fill" : "small"}
        />
      </Box>
    </Box>
  );
}

export function DicePicker({
  variant = "sidebar",
}: {
  /**
   * - sidebar: a column of dice buttons
   * - panel: a grid of large round buttons (phones)
   */
  variant?: "sidebar" | "panel";
}) {
  const isPanel = variant === "panel";
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

  const buttons = Object.entries(counts).map(([id, count]) => {
    const die = diceById[id];
    if (!die) {
      return null;
    }

    const isDuality = id === DUALITY_ID;
    const disabled = isDuality ? otherPicked : dualityPicked;
    function handleClick() {
      handleDiceCountIncrease(id);
      clearRollIfNeeded();
    }

    if (isPanel) {
      return (
        <PanelButton
          key={id}
          die={die}
          isDuality={isDuality}
          count={count}
          disabled={disabled}
          onClick={handleClick}
        />
      );
    }

    const button = (
      <IconButton
        onClick={handleClick}
        disabled={disabled}
        aria-label={isDuality ? "Duality Dice" : `${die.style} ${die.type}`}
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
          <Tooltip title="Duality Dice" placement="right" disableInteractive>
            <span>{button}</span>
          </Tooltip>
        ) : (
          button
        )}
      </Badge>
    );
  });

  return isPanel ? (
    <Box
      component="div"
      sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 1 }}
    >
      {buttons}
    </Box>
  ) : (
    <>{buttons}</>
  );
}

/** Large round die button for the phone dice panel */
function PanelButton({
  die,
  isDuality,
  count,
  disabled,
  onClick,
}: {
  die: Die;
  isDuality: boolean;
  count: number;
  disabled: boolean;
  onClick: () => void;
}) {
  // The image fills the whole round button, which the grid sizes
  return (
    <Badge
      // The Duality Dice are on or off, so no count for them
      badgeContent={isDuality ? 0 : count}
      overlap="circular"
      sx={{
        display: "flex",
        ".MuiBadge-badge": {
          bgcolor: "background.default",
          backgroundImage:
            "linear-gradient(rgba(255, 255, 255, 0.30), rgba(255, 255, 255, 0.30))",
          color: "white",
          pointerEvents: "none",
        },
      }}
    >
      <ButtonBase
        onClick={onClick}
        disabled={disabled}
        aria-label={isDuality ? "Duality Dice" : `${die.style} ${die.type}`}
        aria-pressed={count > 0}
        sx={{
          width: "100%",
          aspectRatio: "1",
          p: 0,
          borderRadius: "50%",
          // Only picked dice get a background
          bgcolor: count > 0 ? "rgba(255, 255, 255, 0.16)" : "transparent",
          transition: "background-color 150ms",
          img: {
            opacity: disabled ? 0.3 : 1,
            transition: "opacity 150ms",
          },
        }}
      >
        {isDuality ? (
          <DualityPreview fill />
        ) : (
          <DicePreview diceStyle={die.style} diceType={die.type} size="fill" />
        )}
      </ButtonBase>
    </Badge>
  );
}

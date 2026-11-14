import { useEffect, useMemo, useState } from "react";

import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Fade from "@mui/material/Fade";
import { useTheme, keyframes } from "@mui/material/styles";
import Button from "@mui/material/Button";
import ButtonBase from "@mui/material/ButtonBase";

import CloseIcon from "@mui/icons-material/CloseRounded";
import HiddenIcon from "@mui/icons-material/VisibilityOffRounded";
import RollIcon from "@mui/icons-material/ArrowForwardRounded";

import { RerollDiceIcon } from "../icons/RerollDiceIcon";

import { GradientOverlay } from "./GradientOverlay";
import { ModifierControls } from "./ModifierControls";
import { useDiceRollStore } from "../dice/store";
import { DiceResults } from "./DiceResults";
import { useDiceControlsStore } from "./store";
import { getThrowSpeed, resetDicePool, rollDicePool } from "./rollDicePool";
import { useNarrowLayout } from "../helpers/useNarrowLayout";
import { useTrayInset } from "../helpers/narrowTray";
import { DiceType } from "../types/DiceType";
import { DUALITY_ID } from "../sets/diceSets";

const jiggle = keyframes`
0% { transform: translate(0, 0) rotate(0deg); }
25% { transform: translate(2px, 2px) rotate(2deg); }
50% { transform: translate(0, 0) rotate(0deg); }
75% { transform: translate(-2px, 2px) rotate(-2deg); }
100% { transform: translate(0, 0) rotate(0deg); }
`;

export function DiceRollControls() {
  const defaultDiceCounts = useDiceControlsStore(
    (state) => state.defaultDiceCounts
  );

  const counts = useDiceControlsStore((state) => state.diceCounts);
  // Is currently the default dice state (all counts 0).
  // Advantage only applies to the Duality Dice so it doesn't count here.
  const isDefault = useMemo(
    () =>
      Object.entries(defaultDiceCounts).every(
        ([type, count]) => counts[type as DiceType] === count
      ),
    [counts, defaultDiceCounts]
  );

  const rollValues = useDiceRollStore((state) => state.rollValues);
  const finishedRolling = useMemo(() => {
    const values = Object.values(rollValues);
    if (values.length === 0) {
      return false;
    } else {
      return values.every((value) => value !== null);
    }
  }, [rollValues]);

  if (!isDefault) {
    return (
      <Fade in>
        <span>
          <DicePickedControls />
        </span>
      </Fade>
    );
  } else if (finishedRolling) {
    return (
      <Fade in>
        <span>
          <FinishedRollControls />
        </span>
      </Fade>
    );
  } else {
    return null;
  }
}

function DicePickedControls() {
  const inset = useTrayInset();
  const defaultDiceCounts = useDiceControlsStore(
    (state) => state.defaultDiceCounts
  );
  const counts = useDiceControlsStore((state) => state.diceCounts);
  const hidden = useDiceControlsStore((state) => state.diceHidden);

  function handleRoll() {
    if (hasDice && rollPressTime) {
      rollDicePool(getThrowSpeed(rollPressTime));
    }
    setRollPressTime(null);
  }

  function handleReset() {
    resetDicePool();
  }

  const rollPressTime = useDiceControlsStore(
    (state) => state.diceRollPressTime
  );
  const setRollPressTime = useDiceControlsStore(
    (state) => state.setDiceRollPressTime
  );

  function handlePointerDown() {
    setRollPressTime(performance.now());
  }

  useEffect(() => {
    if (rollPressTime) {
      const handlePointerUp = () => {
        setRollPressTime(null);
      };
      window.addEventListener("pointerup", handlePointerUp);
      return () => {
        window.removeEventListener("pointerup", handlePointerUp);
      };
    }
  }, [rollPressTime]);

  const hasDice = useMemo(
    () =>
      !Object.entries(defaultDiceCounts).every(
        ([type, count]) => counts[type as DiceType] === count
      ),
    [counts, defaultDiceCounts]
  );

  const hasDuality = (counts[DUALITY_ID] || 0) > 0;

  const theme = useTheme();

  return (
    <>
      <ButtonBase
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          height: "100%",
          cursor: hasDice ? "pointer" : "",
          backgroundColor: "rgba(0, 0, 0, 0.25)",
          ":focus": {
            outline: 0,
          },
          ":hover #dice-roll-button": hasDice
            ? {
                backgroundColor: theme.palette.primary.light,
              }
            : {},
          ":active #dice-roll-button": hasDice
            ? {
                backgroundColor: theme.palette.primary.dark,
              }
            : {},
        }}
        onPointerDown={handlePointerDown}
        onPointerUp={handleRoll}
        aria-label="roll"
        disabled={!hasDice}
      >
        <Box
          component="div"
          sx={{
            ":active": {
              animation: `${jiggle} 0.3s infinite`,
            },
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        >
          <Button
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              transition: theme.transitions.create("background-color"),
              whiteSpace: "nowrap",
              // As the Roll button in the phone dice panel
              borderRadius: "20px",
              height: 40,
            }}
            endIcon={<RollIcon />}
            variant="contained"
            size="large"
            disabled={!hasDice}
            id="dice-roll-button"
            // @ts-ignore
            component="div"
          >
            Roll
            {hidden && " (hidden)"}
          </Button>
        </Box>
      </ButtonBase>
      <GradientOverlay top />
      <Stack
        sx={{
          // Top right, where Clear is when there are dice in the tray
          position: "absolute",
          top: inset,
          right: inset,
        }}
      >
        <Tooltip title="Clear" disableInteractive>
          <IconButton
            aria-label="Clear"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              handleReset();
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      {hasDice && (
        // Under the Roll button. A sibling of the roll ButtonBase, so
        // clicking these doesn't roll.
        <Box
          component="div"
          sx={{
            position: "absolute",
            top: "calc(50% + 30px)",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <ModifierControls overTray withAdvantage={hasDuality} />
        </Box>
      )}
    </>
  );
}

function FinishedRollControls() {
  const roll = useDiceRollStore((state) => state.roll);
  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const reroll = useDiceRollStore((state) => state.reroll);

  const rollValues = useDiceRollStore((state) => state.rollValues);
  const finishedRollValues = useMemo(() => {
    const values: Record<string, number> = {};
    for (const [id, value] of Object.entries(rollValues)) {
      if (value !== null) {
        values[id] = value;
      }
    }
    return values;
  }, [rollValues]);

  const [resultsExpanded, setResultsExpanded] = useState(false);
  const narrow = useNarrowLayout();
  const inset = useTrayInset();

  // Reroll top left and Clear top right. On phones the dice panel toggle
  // takes the top left corner, so Reroll moves to the bottom left.
  return (
    <>
      <Box
        component="div"
        sx={{
          position: "absolute",
          ...(narrow ? { bottom: inset } : { top: inset }),
          left: inset,
          zIndex: 1,
        }}
      >
        <Tooltip title="Reroll" disableInteractive>
          <IconButton
            onClick={() => reroll()}
            aria-label="Reroll"
            sx={{ color: "white" }}
          >
            <RerollDiceIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Box
        component="div"
        sx={{ position: "absolute", top: inset, right: inset, zIndex: 1 }}
      >
        <Tooltip title="Clear" disableInteractive>
          <IconButton
            onClick={() => clearRoll()}
            aria-label="Clear"
            sx={{ color: "white" }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Stack
        sx={{
          position: "absolute",
          bottom: 0,
          // Full width: nothing else sits in the bottom corners, and a
          // centred left: 50% box would wrap the result to half the tray
          left: 0,
          right: 0,
          pointerEvents: "none",
          padding: `${inset}px`,
          // Clear of Reroll and the reset view button in the corners
          px: narrow ? `${inset + 48}px` : `${inset}px`,
          alignItems: "center",
        }}
        component="div"
      >
        {roll && (
          <DiceResults
            diceRoll={roll}
            rollValues={finishedRollValues}
            expanded={resultsExpanded}
            onExpand={setResultsExpanded}
          />
        )}
        {roll?.hidden && (
          <Tooltip title="Hidden Roll" sx={{ pointerEvents: "all" }}>
            <HiddenIcon htmlColor="white" />
          </Tooltip>
        )}
      </Stack>
    </>
  );
}

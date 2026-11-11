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
import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";
import Typography from "@mui/material/Typography";
import HiddenIcon from "@mui/icons-material/VisibilityOffRounded";
import RollIcon from "@mui/icons-material/ArrowForwardRounded";

import { RerollDiceIcon } from "../icons/RerollDiceIcon";

import { GradientOverlay } from "./GradientOverlay";
import { useDiceRollStore } from "../dice/store";
import { DiceResults } from "./DiceResults";
import { getDiceToRoll, useDiceControlsStore } from "./store";
import { DiceType } from "../types/DiceType";
import { Advantage } from "./store";
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
  const startRoll = useDiceRollStore((state) => state.startRoll);

  const defaultDiceCounts = useDiceControlsStore(
    (state) => state.defaultDiceCounts
  );
  const diceById = useDiceControlsStore((state) => state.diceById);
  const counts = useDiceControlsStore((state) => state.diceCounts);
  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const advantage = useDiceControlsStore((state) => state.diceAdvantage);
  const bonus = useDiceControlsStore((state) => state.diceBonus);
  const setBonus = useDiceControlsStore((state) => state.setDiceBonus);
  const setAdvantage = useDiceControlsStore((state) => state.setDiceAdvantage);

  const resetDiceCounts = useDiceControlsStore(
    (state) => state.resetDiceCounts
  );

  function handleRoll() {
    if (hasDice && rollPressTime) {
      const dice = getDiceToRoll(counts, advantage, diceById, bonus);
      const activeTimeSeconds = (performance.now() - rollPressTime) / 1000;
      const speedMultiplier = Math.max(1, Math.min(10, activeTimeSeconds * 2));
      startRoll({ dice, hidden }, speedMultiplier);
      handleReset();
    }
    setRollPressTime(null);
  }

  function handleReset() {
    resetDiceCounts();
    setAdvantage(null);
    setBonus(0);
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

  function toggleAdvantage(value: Advantage) {
    setAdvantage(advantage === value ? null : value);
  }

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
                color: theme.palette.primary.contrastText,
                width: "100px",
                "& span": {
                  transform: "translateX(0)",
                },
                backgroundColor: theme.palette.primary.main,
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
              color: hasDice ? "transparent" : "transparent !important",
              "& span": {
                transform: "translate(-23px)",
                color: theme.palette.primary.contrastText,
                transition: theme.transitions.create("transform"),
              },
              transition: theme.transitions.create([
                "width",
                "color",
                "background-color",
              ]),
              minWidth: 0,
              width: "36px",
              overflow: "hidden",
              borderRadius: "20px",
            }}
            endIcon={<RollIcon />}
            variant="contained"
            disabled={!hasDice}
            id="dice-roll-button"
            // @ts-ignore
            component="div"
          >
            Roll
          </Button>
        </Box>
      </ButtonBase>
      <GradientOverlay top />
      <Stack
        sx={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
        }}
      >
        <Tooltip title="Clear" disableInteractive>
          <IconButton
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
              handleReset();
            }}
          >
            <CloseIcon />
          </IconButton>
        </Tooltip>
      </Stack>
      {hasDuality && (
        // Either side of the Roll button. A sibling of the roll ButtonBase,
        // so clicking these doesn't roll. The gap in the middle passes
        // pointer events through to the Roll button.
        <Stack
          direction="row"
          alignItems="center"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        >
          <ModifierButton
            tooltip="Modifier −1"
            onClick={() => setBonus(bonus - 1)}
          >
            <RemoveIcon />
          </ModifierButton>
          <AdvantageButton
            label="DIS"
            tooltip="Disadvantage: subtract a d6"
            active={advantage === "DISADVANTAGE"}
            onClick={() => toggleAdvantage("DISADVANTAGE")}
          />
          {/* Room for the Roll button when it widens on hover */}
          <Box component="div" sx={{ width: "108px" }} />
          <AdvantageButton
            label="ADV"
            tooltip="Advantage: add a d6"
            active={advantage === "ADVANTAGE"}
            onClick={() => toggleAdvantage("ADVANTAGE")}
          />
          <ModifierButton
            tooltip="Modifier +1"
            onClick={() => setBonus(bonus + 1)}
          >
            <AddIcon />
          </ModifierButton>
        </Stack>
      )}
      {hasDuality && bonus !== 0 && (
        // The current modifier, under the Roll button
        <Typography
          variant="h6"
          color="white"
          sx={{
            position: "absolute",
            top: "calc(50% + 24px)",
            left: "50%",
            transform: "translateX(-50%)",
            pointerEvents: "none",
          }}
        >
          {bonus > 0 ? `+${bonus}` : `−${-bonus}`}
        </Typography>
      )}
    </>
  );
}

function ModifierButton({
  tooltip,
  onClick,
  children,
}: {
  tooltip: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={tooltip} disableInteractive>
      <IconButton
        size="small"
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onClick();
        }}
        sx={{ color: "white", pointerEvents: "all" }}
      >
        {children}
      </IconButton>
    </Tooltip>
  );
}

function AdvantageButton({
  label,
  tooltip,
  active,
  onClick,
}: {
  label: string;
  tooltip: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip title={tooltip} disableInteractive>
      <Button
        size="small"
        variant={active ? "contained" : "text"}
        color={active ? "primary" : "inherit"}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onClick();
        }}
        sx={{ borderRadius: "20px", minWidth: "48px", pointerEvents: "all" }}
      >
        {label}
      </Button>
    </Tooltip>
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

  return (
    <>
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          pointerEvents: "none",
          padding: 3,
        }}
        component="div"
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          width="100%"
          alignItems="start"
        >
          <Tooltip title="Reroll" sx={{ pointerEvents: "all" }}>
            <IconButton
              onClick={() => reroll()}
              sx={{ pointerEvents: "all", color: "white" }}
            >
              <RerollDiceIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Clear" sx={{ pointerEvents: "all" }}>
            <IconButton
              onClick={() => clearRoll()}
              sx={{ pointerEvents: "all", color: "white" }}
            >
              <CloseIcon />
            </IconButton>
          </Tooltip>
        </Stack>
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
          padding: 3,
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

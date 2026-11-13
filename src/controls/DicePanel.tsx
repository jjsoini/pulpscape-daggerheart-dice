import { useEffect, useMemo, useRef, useState } from "react";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Fade from "@mui/material/Fade";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import { useTheme } from "@mui/material/styles";

import DiceIcon from "@mui/icons-material/CasinoRounded";
import ClearIcon from "@mui/icons-material/CloseRounded";
import RollIcon from "@mui/icons-material/ArrowForwardRounded";
import HiddenOnIcon from "@mui/icons-material/VisibilityOffRounded";
import HiddenOffIcon from "@mui/icons-material/VisibilityRounded";

import { DicePicker } from "./DicePicker";
import { DiceSetToggle } from "./DiceSetPicker";
import { useDiceControlsStore } from "./store";
import { DualityControls } from "./DualityControls";
import { useDiceRollStore } from "../dice/store";
import { getThrowSpeed, resetDicePool, rollDicePool } from "./rollDicePool";
import { PluginGate } from "../plugin/PluginGate";
import { PartyTrays } from "../plugin/PartyTrays";
import { DiceResults } from "./DiceResults";
import { RerollDiceIcon } from "../icons/RerollDiceIcon";
import { DUALITY_ID } from "../sets/diceSets";
import {
  CORNER_BUTTON,
  CORNER_INSET,
  trayTop,
  traySide,
  cornerRowOffset,
} from "../helpers/narrowTray";

/** Space between the avatars in the players strip, in pixels */
const STRIP_GAP = 8;

/**
 * Dice controls for phones, covering the whole popover.
 *
 * Opened with the toggle in the top left, to pick dice (and advantage and
 * the modifier for the Duality Dice) and roll.
 */
export function DicePanel({
  open,
  onClose,
}: {
  open: boolean;
  /** To watch the dice roll after a reroll */
  onClose: () => void;
}) {
  const theme = useTheme();
  const hasRoll = useDiceRollStore((state) => Boolean(state.roll));
  const clearRoll = useDiceRollStore((state) => state.clearRoll);
  const counts = useDiceControlsStore((state) => state.diceCounts);
  const hasPool = Object.values(counts).some((count) => count > 0);
  const hasDuality = (counts[DUALITY_ID] || 0) > 0;

  // Width for the players strip's avatars to fit in
  // (a callback ref, as the strip only mounts once the plugin is ready)
  const [strip, setStrip] = useState<HTMLDivElement | null>(null);
  const [stripWidth, setStripWidth] = useState<number>();
  useEffect(() => {
    if (!strip) {
      return;
    }
    const observer = new ResizeObserver(() => {
      const style = getComputedStyle(strip);
      setStripWidth(
        strip.clientWidth -
          parseFloat(style.paddingLeft) -
          parseFloat(style.paddingRight)
      );
    });
    observer.observe(strip);
    return () => observer.disconnect();
  }, [strip]);

  return (
    <Fade in={open}>
      <Stack
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          bgcolor:
            theme.palette.mode === "dark"
              ? "rgba(34, 38, 57, 0.97)"
              : "rgba(241, 243, 249, 0.97)",
          px: `${CORNER_INSET}px`,
          // Below the buttons along the tray's top edge
          pt: trayTop(CORNER_INSET + CORNER_BUTTON + 16),
          pb: `${CORNER_INSET}px`,
          gap: 1.5,
          overflowY: "auto",
        }}
      >
        {/* Lined up with the tray's corner buttons: the panel toggle (see
            DicePanelToggle) then the dice set in the top left, Clear top
            right */}
        <Box
          component="div"
          sx={{
            position: "absolute",
            top: trayTop(),
            left: traySide(cornerRowOffset(1)),
          }}
        >
          <DiceSetToggle />
        </Box>
        {/* Clears the tray, like the tray's own Clear, or else the pool */}
        <Fade in={hasRoll || hasPool}>
          <Box
            component="div"
            sx={{ position: "absolute", top: trayTop(), right: traySide() }}
          >
            <Tooltip title="Clear" disableInteractive>
              <IconButton
                onClick={() => (hasRoll ? clearRoll() : resetDicePool())}
                aria-label="Clear"
              >
                <ClearIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
        <DicePicker variant="panel" />
        {hasDuality && <DualityControls />}
        <Box component="div" flexGrow={1} />
        {/* Other players in a strip above the roll buttons, scrolling
            sideways when they don't fit (centred when they do) */}
        <PluginGate>
          <Stack
            ref={setStrip}
            direction="row"
            alignItems="flex-start"
            gap={`${STRIP_GAP}px`}
            mx={`-${CORNER_INSET}px`}
            px={`${CORNER_INSET}px`}
            pt={1}
            pb={0.5}
            sx={{
              overflowX: "auto",
              // Badges reach below the avatars, don't scroll for them
              overflowY: "hidden",
              // Scrolls by swiping, without a scrollbar
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
              // Divider above the players, gone with the strip when empty
              borderTop: 1,
              borderColor: "divider",
              "&:empty": { display: "none" },
              "& > :first-of-type": { ml: "auto" },
              "& > :last-of-type": { mr: "auto" },
            }}
          >
            <PartyTrays
              avatarSize="large"
              fitWidth={stripWidth}
              gap={STRIP_GAP}
            />
          </Stack>
        </PluginGate>
        {hasRoll ? <RollResultRow onReroll={onClose} /> : <RollRow />}
      </Stack>
    </Fade>
  );
}

/** Hidden toggle and the Roll button, held down it throws harder */
function RollRow() {
  const counts = useDiceControlsStore((state) => state.diceCounts);
  const hidden = useDiceControlsStore((state) => state.diceHidden);
  const toggleHidden = useDiceControlsStore((state) => state.toggleDiceHidden);
  const hasDice = useMemo(
    () => Object.values(counts).some((count) => count > 0),
    [counts]
  );
  const pressTime = useRef<number | null>(null);

  return (
    <Stack direction="row" gap={1} alignItems="center">
      <Tooltip title={hidden ? "Show roll" : "Hide roll"} disableInteractive>
        <IconButton
          onClick={() => toggleHidden()}
          aria-label={hidden ? "Show roll" : "Hide roll"}
          sx={{ bgcolor: "action.hover", width: 40, height: 40 }}
        >
          {hidden ? <HiddenOnIcon /> : <HiddenOffIcon />}
        </IconButton>
      </Tooltip>
      <Button
        variant="contained"
        size="large"
        fullWidth
        disabled={!hasDice}
        endIcon={<RollIcon />}
        onPointerDown={() => {
          pressTime.current = performance.now();
        }}
        onClick={() => {
          rollDicePool(getThrowSpeed(pressTime.current));
          pressTime.current = null;
        }}
        sx={{ borderRadius: "20px", height: 40, whiteSpace: "nowrap" }}
      >
        Roll
        {hidden && " (hidden)"}
      </Button>
    </Stack>
  );
}

/**
 * Opens and closes the dice panel. It stays in the tray's top left corner
 * whether the panel is open or not.
 */
export function DicePanelToggle({
  open,
  onToggle,
}: {
  open: boolean;
  onToggle: () => void;
}) {
  const theme = useTheme();
  return (
    <Tooltip
      title={open ? "Show the tray" : "Dice"}
      placement="right"
      disableInteractive
    >
      <IconButton
        onClick={onToggle}
        aria-label={open ? "Show the tray" : "Dice"}
        aria-pressed={open}
        sx={{
          position: "absolute",
          top: trayTop(),
          left: traySide(),
          zIndex: 3,
          color: open ? theme.palette.primary.contrastText : "white",
          bgcolor: open ? theme.palette.primary.main : "rgba(0, 0, 0, 0.45)",
          "&:hover": {
            bgcolor: open ? theme.palette.primary.dark : "rgba(0, 0, 0, 0.6)",
          },
        }}
      >
        <DiceIcon />
      </IconButton>
    </Tooltip>
  );
}

/** Reroll and the result with its breakdown, as along the tray's bottom */
function RollResultRow({ onReroll }: { onReroll: () => void }) {
  const roll = useDiceRollStore((state) => state.roll);
  const rollValues = useDiceRollStore((state) => state.rollValues);
  const reroll = useDiceRollStore((state) => state.reroll);
  const [expanded, setExpanded] = useState(false);

  const finishedValues = useMemo(() => {
    const values = Object.values(rollValues);
    if (values.length === 0 || values.some((value) => value === null)) {
      return null;
    }
    return rollValues as Record<string, number>;
  }, [rollValues]);

  if (!roll) {
    return null;
  }

  return (
    <Stack
      direction="row"
      alignItems="end"
      justifyContent="space-between"
      gap={1}
      minHeight={CORNER_BUTTON}
    >
      <Box component="div" width={CORNER_BUTTON} flexShrink={0}>
        {finishedValues && (
          <Tooltip title="Reroll" disableInteractive>
            <IconButton
              aria-label="Reroll"
              onClick={() => {
                reroll();
                onReroll();
              }}
            >
              <RerollDiceIcon />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Stack alignItems="center" minWidth={0} flexGrow={1}>
        {finishedValues && (
          <DiceResults
            diceRoll={roll}
            rollValues={finishedValues}
            expanded={expanded}
            onExpand={setExpanded}
          />
        )}
      </Stack>
      {/* Balances Reroll so the result stays centred */}
      <Box component="div" width={CORNER_BUTTON} flexShrink={0} />
    </Stack>
  );
}

import { useEffect, useState } from "react";

import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";

import HistoryIcon from "@mui/icons-material/SavedSearchRounded";
import NoHistoryIcon from "@mui/icons-material/ManageSearchRounded";

import { useDiceRollStore } from "../dice/store";
import { RecentRoll, useDiceHistoryStore } from "./history";
import { DicePreview } from "../previews/DicePreview";
import { resetDicePool, rollPick } from "./rollDicePool";
import { getCombinedDiceValue } from "../helpers/getCombinedDiceValue";
import { DualityResult, getDualityResult } from "../helpers/getDualityResult";
import { DUALITY_ID, FEAR_STYLE, HOPE_STYLE } from "../sets/diceSets";
import { DiceType } from "../types/DiceType";

/** Attach the final result to the active history entry once the dice settle */
function useRecordRollResult() {
  const roll = useDiceRollStore((state) => state.roll);
  const rollValues = useDiceRollStore((state) => state.rollValues);
  const setActiveRollResult = useDiceHistoryStore(
    (state) => state.setActiveRollResult
  );

  useEffect(() => {
    const values = Object.values(rollValues);
    if (!roll || values.length === 0) {
      return;
    }
    if (values.every((value) => value !== null)) {
      const finished = rollValues as Record<string, number>;
      setActiveRollResult({
        value: getCombinedDiceValue(roll, finished),
        duality: getDualityResult(roll, finished),
      });
    } else {
      // Dice are rolling again (a die thrown again, or Reroll as a new
      // entry), clear the old result
      setActiveRollResult(null);
    }
  }, [roll, rollValues, setActiveRollResult]);
}

/**
 * Your recent rolls, newest first, with their results. Picking one rolls the
 * same dice, advantage and modifier again.
 */
export function DiceHistory({
  placement = "right",
}: {
  /** Where the history menu opens from the button */
  placement?: "right" | "bottom";
}) {
  useRecordRollResult();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  function handleClose() {
    setAnchorEl(null);
  }

  function handleRoll(roll: RecentRoll) {
    rollPick(roll);
    resetDicePool();
    handleClose();
  }

  const recentRolls = useDiceHistoryStore((state) => state.recentRolls);
  const removeRecentRoll = useDiceHistoryStore(
    (state) => state.removeRecentRoll
  );

  return (
    <>
      <Tooltip
        title="History"
        placement={placement === "bottom" ? "bottom" : "right"}
        disableInteractive
      >
        <IconButton
          aria-label="History"
          id="history-button"
          aria-controls={open ? "history-menu" : undefined}
          aria-haspopup="true"
          aria-expanded={open ? "true" : undefined}
          onClick={(event: React.MouseEvent<HTMLButtonElement>) =>
            setAnchorEl(event.currentTarget)
          }
        >
          <HistoryIcon />
        </IconButton>
      </Tooltip>
      <Menu
        id="history-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          "aria-labelledby": "history-button",
        }}
        anchorOrigin={
          placement === "bottom"
            ? { vertical: "bottom", horizontal: "left" }
            : { vertical: "center", horizontal: "right" }
        }
        transformOrigin={
          placement === "bottom"
            ? { vertical: "top", horizontal: "left" }
            : { vertical: "center", horizontal: "left" }
        }
      >
        <Stack
          // Fits a phone's popover, whose width is about the same
          width={
            placement === "bottom" ? "min(280px, calc(100vw - 40px))" : "280px"
          }
          px={1}
          gap={0.5}
        >
          {/* Stored oldest first, shown newest first */}
          {recentRolls
            .map((recentRoll, index) => (
              <RecentRollChip
                key={recentRoll.id}
                recentRoll={recentRoll}
                onRoll={() => handleRoll(recentRoll)}
                onDelete={() => removeRecentRoll(index)}
              />
            ))
            .reverse()}
          {recentRolls.length === 0 && <EmptyMessage />}
        </Stack>
      </Menu>
    </>
  );
}

const dualityLabels: Record<DualityResult, string> = {
  HOPE: "Hope",
  FEAR: "Fear",
  CRITICAL: "Crit",
};

function RecentRollChip({
  recentRoll,
  onRoll,
  onDelete,
}: {
  recentRoll: RecentRoll;
  onRoll: () => void;
  onDelete: () => void;
}) {
  const { advantage, bonus, result } = recentRoll;
  // The Duality Dice show as the Hope and Fear d12, other rolls as text
  const isDuality = (recentRoll.counts[DUALITY_ID] || 0) > 0;
  const modifier = bonus > 0 ? `+${bonus}` : bonus < 0 ? `−${-bonus}` : "";

  return (
    <Chip
      sx={{
        flexGrow: 1,
        flexBasis: 0,
        height: "auto",
        minHeight: "32px",
        ".MuiChip-label": {
          whiteSpace: "normal",
          px: 0,
        },
        ".MuiChip-deleteIcon": {
          position: "absolute",
          right: 0,
        },
      }}
      label={
        <Stack
          direction="row"
          alignItems="center"
          flexWrap="wrap"
          columnGap={0.5}
          pl={1}
          pr={3}
          py={0.25}
        >
          {isDuality ? (
            <>
              <Stack direction="row" alignItems="center" px="4px">
                {[HOPE_STYLE, FEAR_STYLE].map((style) => (
                  <Box key={style} component="span" display="flex" mx="-4px">
                    <DicePreview
                      diceStyle={style}
                      diceType="D12"
                      size="small"
                    />
                  </Box>
                ))}
              </Stack>
              {advantage && (
                <Typography component="span" variant="caption">
                  {advantage === "ADVANTAGE" ? "ADV" : "DIS"}
                </Typography>
              )}
              {modifier && (
                <Typography component="span" variant="body2">
                  {modifier}
                </Typography>
              )}
            </>
          ) : (
            <Typography component="span" variant="body2" lineHeight="28px">
              {getDiceNotation(recentRoll)}
              {modifier}
            </Typography>
          )}
          {result && result.value !== null && (
            <Typography
              component="span"
              variant="body2"
              fontWeight="bold"
              whiteSpace="nowrap"
            >
              = {result.value}
              {result.duality && ` ${dualityLabels[result.duality]}`}
            </Typography>
          )}
        </Stack>
      }
      variant="filled"
      onClick={() => onRoll()}
      onDelete={() => onDelete()}
    />
  );
}

/** Dice in the order of the picker */
const DICE_ORDER: DiceType[] = ["D4", "D6", "D8", "D10", "D12", "D20"];

/** The dice of a roll as text, e.g. "3d6+d8", whichever set they're from */
function getDiceNotation(roll: RecentRoll) {
  const countsByType: Partial<Record<DiceType, number>> = {};
  for (const [id, count] of Object.entries(roll.counts)) {
    const die = roll.diceById[id];
    if (die && count > 0) {
      countsByType[die.type] = (countsByType[die.type] || 0) + count;
    }
  }
  return DICE_ORDER.filter((type) => countsByType[type])
    .map((type) => {
      const count = countsByType[type]!;
      return `${count > 1 ? count : ""}${type.toLowerCase()}`;
    })
    .join("+");
}

function EmptyMessage() {
  const theme = useTheme();

  return (
    <Stack
      sx={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 0.5,
        pb: 1,
      }}
    >
      <Box
        component="div"
        sx={{
          fontSize: "2rem",
          color:
            theme.palette.mode === "dark"
              ? "rgba(255, 255, 255, 0.46)"
              : "rgba(0, 0, 0, 0.46)",
          display: "flex",
          p: 1,
        }}
      >
        <NoHistoryIcon />
      </Box>
      <Typography variant="h6">No History</Typography>
      <Typography variant="caption" textAlign="center">
        Roll dice to add to the roll history.
      </Typography>
    </Stack>
  );
}

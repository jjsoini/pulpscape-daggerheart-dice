import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import AddIcon from "@mui/icons-material/AddRounded";
import RemoveIcon from "@mui/icons-material/RemoveRounded";

import { Advantage, useDiceControlsStore } from "./store";

/**
 * The modifier's "−" and "+" buttons, for any roll. For the Duality Dice
 * the advantage toggles go between them: "− DIS ADV +". The modifier shows
 * in the middle once it isn't 0, in a space kept for it.
 */
export function ModifierControls({
  overTray = false,
  withAdvantage = false,
}: {
  /** White over the tray, else in the theme's colours (the phone panel) */
  overTray?: boolean;
  /** Show DIS and ADV (the Duality Dice are picked) */
  withAdvantage?: boolean;
}) {
  const advantage = useDiceControlsStore((state) => state.diceAdvantage);
  const setAdvantage = useDiceControlsStore((state) => state.setDiceAdvantage);
  const bonus = useDiceControlsStore((state) => state.diceBonus);
  const setBonus = useDiceControlsStore((state) => state.setDiceBonus);

  function toggleAdvantage(value: Advantage) {
    setAdvantage(advantage === value ? null : value);
  }

  const color = overTray ? "white" : undefined;
  const size = overTray ? "small" : "medium";

  return (
    <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
      <ModifierButton
        tooltip="Modifier −1"
        color={color}
        size={size}
        onClick={() => setBonus(bonus - 1)}
      >
        <RemoveIcon />
      </ModifierButton>
      {withAdvantage && (
        <AdvantageButton
          label="DIS"
          tooltip="Disadvantage: subtract a d6"
          active={advantage === "DISADVANTAGE"}
          size={size}
          onClick={() => toggleAdvantage("DISADVANTAGE")}
        />
      )}
      {/* Always takes its space, so the buttons don't move when the
          modifier appears */}
      <Typography
        variant="h6"
        aria-label="Modifier"
        aria-hidden={bonus === 0}
        color={color ?? "text.primary"}
        textAlign="center"
        minWidth="2em"
        sx={{ visibility: bonus === 0 ? "hidden" : "visible" }}
      >
        {bonus > 0 ? `+${bonus}` : bonus < 0 ? `−${-bonus}` : "0"}
      </Typography>
      {withAdvantage && (
        <AdvantageButton
          label="ADV"
          tooltip="Advantage: add a d6"
          active={advantage === "ADVANTAGE"}
          size={size}
          onClick={() => toggleAdvantage("ADVANTAGE")}
        />
      )}
      <ModifierButton
        tooltip="Modifier +1"
        color={color}
        size={size}
        onClick={() => setBonus(bonus + 1)}
      >
        <AddIcon />
      </ModifierButton>
    </Stack>
  );
}

function ModifierButton({
  tooltip,
  color,
  size,
  onClick,
  children,
}: {
  tooltip: string;
  color?: string;
  size: "small" | "medium";
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip title={tooltip} disableInteractive>
      <IconButton
        size={size}
        aria-label={tooltip}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          // Over the tray, a click shouldn't also roll
          e.stopPropagation();
          onClick();
        }}
        sx={{ color }}
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
  size,
  onClick,
}: {
  label: string;
  tooltip: string;
  active: boolean;
  size: "small" | "medium";
  onClick: () => void;
}) {
  return (
    <Tooltip title={tooltip} disableInteractive>
      <Button
        size={size}
        variant={active ? "contained" : "text"}
        color={active ? "primary" : "inherit"}
        aria-pressed={active}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation();
          onClick();
        }}
        sx={{
          borderRadius: "20px",
          minWidth: size === "small" ? "48px" : "56px",
          height: size === "small" ? undefined : 40,
        }}
      >
        {label}
      </Button>
    </Tooltip>
  );
}

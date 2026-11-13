import { Player } from "@owlbear-rodeo/sdk";

import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Badge from "@mui/material/Badge";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import { useTheme } from "@mui/material/styles";

import { usePlayerDice } from "./usePlayerDice";
import { useResultDelay } from "../helpers/useResultDelay";

/** Sizes of a large avatar at scale 1, in pixels */
const LARGE_AVATAR = 56;
const LARGE_WIDTH = 72;

/** Width a large avatar takes at a scale */
export function getLargeAvatarWidth(scale = 1) {
  return Math.round(LARGE_WIDTH * scale);
}

export function PlayerAvatar({
  player,
  onSelect,
  size = "small",
  scale = 1,
}: {
  player: Player;
  onSelect: () => void;
  /** small for the sidebar, large for the phone dice panel */
  size?: "small" | "large";
  /** Shrinks a large avatar to fit more players in the panel's strip */
  scale?: number;
}) {
  const large = size === "large";
  const px = (value: number) => Math.round(value * scale);
  const { diceRoll, finalValue, finishedRolling } = usePlayerDice(player);
  const resultShown = useResultDelay(diceRoll, finishedRolling);

  const theme = useTheme();

  return (
    <Stack
      alignItems="center"
      my={0.5}
      // In the panel's strip, keep full size and let the strip scroll
      width={large ? `${getLargeAvatarWidth(scale)}px` : undefined}
      flexShrink={large ? 0 : undefined}
    >
      <Badge
        badgeContent={resultShown ? finalValue : null}
        showZero
        overlap="circular"
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        sx={{
          ".MuiBadge-badge": {
            bgcolor: "background.paper",
          },
          pointerEvents: "none",
        }}
        max={999}
      >
        <IconButton
          sx={{ borderRadius: "50%", p: 0, pointerEvents: "all" }}
          onClick={() => onSelect()}
          aria-label={player.name}
        >
          <Avatar
            sx={{
              bgcolor: player.color,
              opacity: "0.5",
              boxShadow: theme.shadows[5],
              width: large ? px(LARGE_AVATAR) : 32,
              height: large ? px(LARGE_AVATAR) : 32,
              fontSize: large ? `${1.5 * scale}rem` : undefined,
            }}
          >
            {player.name[0]}
          </Avatar>
        </IconButton>
      </Badge>
      <Typography
        variant="caption"
        color="rgba(255, 255, 255, 0.7)"
        textAlign="center"
        width={large ? "100%" : "40px"}
        noWrap
      >
        {player.name}
      </Typography>
    </Stack>
  );
}

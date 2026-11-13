import OBR, { Player } from "@owlbear-rodeo/sdk";
import { useEffect, useMemo, useState } from "react";

import Dialog from "@mui/material/Dialog";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";

import CloseIcon from "@mui/icons-material/ChevronLeftRounded";

import { SlideTransition } from "../controls/SlideTransition";
import { PlayerTray } from "./PlayerTray";
import { PlayerAvatar, getLargeAvatarWidth } from "./PlayerAvatar";
import { getPluginId } from "./getPluginId";
import { useNarrowLayout } from "../helpers/useNarrowLayout";
import { traySide, trayTop } from "../helpers/narrowTray";

/** The smallest large avatars get before the strip scrolls instead */
const MIN_SCALE = 0.5;

export function PartyTrays({
  avatarSize = "small",
  fitWidth,
  gap = 0,
}: {
  avatarSize?: "small" | "large";
  /** Width the large avatars should fit in, shrinking them if needed */
  fitWidth?: number;
  /** Space between the avatars, in pixels */
  gap?: number;
} = {}) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [focusedTray, setFocusTray] = useState<string | null>(null);

  useEffect(() => {
    OBR.party.getPlayers().then(setPlayers);
  }, []);
  useEffect(() => OBR.party.onChange(setPlayers), []);

  const focusedPlayer = useMemo(() => {
    if (focusedTray) {
      return players.find((player) => player.connectionId === focusedTray);
    } else {
      return;
    }
  }, [players, focusedTray]);

  const theme = useTheme();
  const narrow = useNarrowLayout();

  // Setup a broadcast channel so the popover can open a tray
  useEffect(() => {
    if (window.BroadcastChannel) {
      const channel = new BroadcastChannel(getPluginId("focused-tray"));
      channel.onmessage = (event) => {
        setFocusTray(event.data);
      };
      return () => {
        channel.close();
      };
    }
  }, []);

  // Shrink large avatars to fit side by side, down to MIN_SCALE (then the
  // strip scrolls). The gaps between them don't shrink.
  const scale = useMemo(() => {
    if (avatarSize !== "large" || !fitWidth || players.length === 0) {
      return 1;
    }
    const room = fitWidth - gap * (players.length - 1);
    let scale = 1;
    while (
      scale > MIN_SCALE &&
      players.length * getLargeAvatarWidth(scale) > room
    ) {
      scale = Math.round((scale - 0.02) * 100) / 100;
    }
    return Math.max(MIN_SCALE, scale);
  }, [avatarSize, fitWidth, gap, players.length]);

  if (players.length === 0) {
    return null;
  }

  return (
    <>
      {players.map((player) => (
        <PlayerAvatar
          key={player.connectionId}
          player={player}
          onSelect={() => setFocusTray(player.connectionId)}
          size={avatarSize}
          scale={scale}
        />
      ))}
      <Dialog
        open={Boolean(focusedPlayer)}
        onClose={() => setFocusTray(null)}
        fullScreen
        TransitionComponent={SlideTransition}
        hideBackdrop
        PaperProps={{
          sx: {
            bgcolor:
              theme.palette.mode === "dark"
                ? "rgba(34, 38, 57, 0.9)"
                : "rgba(241, 243, 249, 0.9)",
          },
        }}
        // Keep mounted to allow the canvas to be ready
        // during the open animation
        keepMounted
      >
        {narrow ? (
          // Phones: the tray fills the popover, with a back button in its
          // top left corner like the dice panel toggle
          <Stack
            position="relative"
            width="100%"
            height="100%"
            overflow="hidden"
            alignItems="center"
            justifyContent="center"
          >
            <PlayerTray player={focusedPlayer} narrow />
            <IconButton
              onClick={() => setFocusTray(null)}
              aria-label="Back"
              sx={{
                position: "absolute",
                top: trayTop(),
                left: traySide(),
                color: "white",
                bgcolor: "rgba(0, 0, 0, 0.45)",
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.6)" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        ) : (
          <Stack
            pl="60px"
            position="relative"
            width="100%"
            height="100%"
            overflow="hidden"
          >
            <PlayerTray player={focusedPlayer} />
            <IconButton
              onClick={() => setFocusTray(null)}
              sx={{
                position: "absolute",
                left: 12,
                top: 12,
                height: "calc(100% - 24px)",
                borderRadius: 0.5,
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>
        )}
      </Dialog>
    </>
  );
}

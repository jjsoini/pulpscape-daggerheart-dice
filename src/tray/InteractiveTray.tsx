import { Canvas } from "@react-three/fiber";
import { ContactShadows, Environment, OrbitControls } from "@react-three/drei";

import Box from "@mui/material/Box";
import Fade from "@mui/material/Fade";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import WholeTrayIcon from "@mui/icons-material/FitScreenRounded";

import { InteractiveDiceRoll } from "../dice/InteractiveDiceRoll";
import { DiceRollControls } from "../controls/DiceRollControls";
import environment from "../environment.hdr";
import { AudioListenerProvider } from "../audio/AudioListenerProvider";
import { Tray } from "./Tray";
import { useDebugStore } from "../debug/store";
import { TraySuspense } from "./TraySuspense";
import { PreviewDiceRoll } from "../dice/PreviewDiceRoll";
import { TrayCamera, useTrayViewStore } from "./TrayCamera";
import { useTrayInset } from "../helpers/narrowTray";

/** Dice tray that controls the dice roll store */
export function InteractiveTray({
  width = "calc(100vh / 2)",
  height = "100vh",
  narrow = false,
}: {
  /** CSS size of the tray, which should stay 1:2 */
  width?: string;
  height?: string;
  /** Phone layout: the camera zooms in on the dice after a roll */
  narrow?: boolean;
}) {
  const allowOrbit = useDebugStore((state) => state.allowOrbit);

  return (
    <Box
      component="div"
      borderRadius={1}
      height={height}
      width={width}
      overflow="hidden"
      position="relative"
      id="interactive-tray"
      sx={{
        "& canvas": {
          // Pinch and pan are handled by the tray camera
          touchAction: "none",
          userSelect: "none",
        },
      }}
    >
      <TraySuspense>
        <Canvas frameloop="demand">
          <AudioListenerProvider>
            <Environment files={environment} />
            <ContactShadows
              resolution={256}
              scale={[1, 2]}
              position={[0, 0, 0]}
              blur={0.5}
              opacity={0.5}
              far={1}
              color="#222222"
            />
            <Tray />
            <PreviewDiceRoll />
            <InteractiveDiceRoll />
            <TrayCamera autoFrame={narrow} />
            {allowOrbit && <OrbitControls />}
          </AudioListenerProvider>
        </Canvas>
      </TraySuspense>
      <DiceRollControls />
      <WholeTrayButton />
    </Box>
  );
}

/** Shown when zoomed in: ease back to the whole tray */
function WholeTrayButton() {
  const zoomed = useTrayViewStore((state) => state.zoomed);
  const reset = useTrayViewStore((state) => state.reset);
  const inset = useTrayInset();
  return (
    <Fade in={zoomed} unmountOnExit>
      <Box
        component="div"
        // Bottom right corner, right of the result
        sx={{ position: "absolute", bottom: inset, right: inset }}
      >
        <Tooltip title="Reset view" placement="left" disableInteractive>
          <IconButton onClick={() => reset()} sx={{ color: "white" }}>
            <WholeTrayIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Fade>
  );
}

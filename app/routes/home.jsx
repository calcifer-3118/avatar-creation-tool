import { Canvas } from "@react-three/fiber";
import { useGLTF, Environment } from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import { CircularProgress, Box, Typography, IconButton } from "@mui/material";
import { useLocation } from "@remix-run/react";
import { RigidBody } from "@react-three/rapier";
import Ecctrl, { EcctrlAnimation } from "../utils/Ecctrl";

import { Physics } from "@react-three/rapier";
import { KeyboardControls } from "@react-three/drei";

const BackgroundMusic = ({ src, isPlaying }) => {
  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0.5;

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error("Audio playback error:", error);
      });
    } else {
      audio.pause();
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [src, isPlaying]);

  return null;
};

const Model = ({ avatarUrl }) => {
  const { scene } = useGLTF(avatarUrl);
  scene.position.y = -0.9;
  scene.scale.set(1.6, 1.6, 1.6);
  return <primitive object={scene} />;
};

const Map = () => {
  // Same as before
  const sceneFilenames = [
    "/Open_Area.glb",
    "/Garden.glb",
    "/Fountain.glb",
    "/Floor.glb",
    "/Open_Event_Area.glb",
    "/Mall_Ext.glb",
    "/Mall_Glass.glb",
    "/Stadium_Ext.glb",
    "/Stadium_Int.glb",
    "/Funzone_ext.glb",
    "/Mall_Int.glb",
    "/Path.glb",
    "/Spawn_Ext.glb",
    "/Spawn_Int.glb",
  ];

  const scenes = sceneFilenames.map((filename) => {
    const { scene } = useGLTF(filename);
    scene.position.set(35, -20, 0);
    return scene;
  });

  return (
    <RigidBody type="fixed" colliders="trimesh" ccd>
      {scenes.map((scene, index) => (
        <primitive key={index} object={scene} />
      ))}
    </RigidBody>
  );
};

const Home = () => {
  const location = useLocation();
  const avatarUrl = location.state?.avatarUrl;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
    { name: "rightward", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] },
    { name: "run", keys: ["Shift"] },
    { name: "action1", keys: ["f"] },
  ];

  const animations = [
    "F_Dances_001",
    "F_Dances_004",
    "F_Dances_007",
    "F_Dances_006",
    "M_Dances_006",
    "M_Dances_001",
    "M_Dances_011",
    "M_Dances_004",
  ];

  const animationSet = {
    idle: "F_Standing_Idle_001",
    walk: "F_Walk_003",
    run: "F_Run_001",
    jump: "F_Standing_Idle_001",
    jumpIdle: "F_Standing_Idle_001",
    jumpLand: "F_Standing_Idle_001",
    fall: "F_Falling_Idle_000",
    action1: animations[Math.floor(Math.random() * animations.length)],
  };

  useEffect(() => {
    window.addEventListener("keydown", (e) => {
      if (e.key == "f" && !isPlaying) {
        setIsPlaying(true);
      }
    });
  });
  const handleAudioToggle = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <Suspense
      fallback={
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
          bgcolor="background.default"
          color="text.primary"
        >
          <Box textAlign="center">
            <CircularProgress />
            <Typography variant="h6" mt={2}>
              Loading, please wait...
            </Typography>
          </Box>
        </Box>
      }
    >
      <Canvas style={{ width: "100vw", height: "100vh" }} shadows>
        <directionalLight
          intensity={0.7}
          color={"#FFFFED"}
          castShadow
          shadow-bias={-0.0004}
          position={[-20, 20, 20]}
          shadow-camera-top={20}
          shadow-camera-right={20}
          shadow-camera-bottom={-20}
          shadow-camera-left={-20}
        />
        <ambientLight intensity={0.5} />
        <Physics timeStep="vary">
          <Suspense fallback={null}>
            <Environment files="/HDRI.jpg" />
            <KeyboardControls map={keyboardMap}>
              <Ecctrl animated>
                <EcctrlAnimation
                  characterURL={avatarUrl} // Must have property
                  animationSet={animationSet} // Must have property
                >
                  <Model avatarUrl={avatarUrl} />
                </EcctrlAnimation>
              </Ecctrl>
            </KeyboardControls>
            <Map />
          </Suspense>
        </Physics>
      </Canvas>

      <Box
        onClick={() => setIsHovered((prev) => !prev)}
        style={{
          position: "fixed",
          bottom: "9%",
          left: "1%",
          fontSize: !isHovered ? "3rem" : "1.7rem",
          width: !isHovered ? "50px" : "260px",
          height: !isHovered ? "50px" : "220px",
          backgroundColor: !isHovered ? "transparent" : "#6600cc",
          transition: "width 0.3s ease",
          borderRadius: "20px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "10px",
          cursor: "pointer",
        }}
      >
        {isHovered ? (
          <>
            <Box style={{ marginBottom: "9px" }}>Movement : WASD</Box>
            <Box style={{ marginBottom: "9px" }}>Jump : Space</Box>
            <Box style={{ marginBottom: "9px" }}>Sprint : Shift</Box>
            <Box style={{ marginBottom: "9px" }}>Dance : F</Box>
          </>
        ) : (
          "🎮"
        )}
      </Box>
      <IconButton
        style={{
          position: "fixed",
          bottom: "2%",
          left: "2%",
          fontSize: "2.3rem",
        }}
        onClick={handleAudioToggle}
      >
        {isPlaying ? "🔊" : "🔇"}
      </IconButton>

      <BackgroundMusic src="/audio/bg.mp3" isPlaying={isPlaying} />
    </Suspense>
  );
};

export default Home;

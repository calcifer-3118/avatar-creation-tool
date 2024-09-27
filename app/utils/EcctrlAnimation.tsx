import { useGLTF, useAnimations } from "@react-three/drei";
import { useEffect, useRef, Suspense, useState } from "react";
import * as THREE from "three";
import { useGame, type AnimationSet } from "./stores/useGame";
import React from "react";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";


export function EcctrlAnimation(props: EcctrlAnimationProps) {
  // Change the character src to yours
   const group = useRef();
  const { scene } = useGLTF(props.characterURL);

  // Track whether animations are fully loaded and added to scene
  const [animationsAdded, setAnimationsAdded] = useState(false);

  const animationUrls = [
    "/animations/F_Standing_Idle_001.glb",
    "/animations/F_Run_001.glb",
    "/animations/F_Walk_003.glb",
    "/animations/F_Falling_Idle_000.glb",
    "/animations/F_Dances_001.glb",
    "/animations/F_Dances_004.glb",
    "/animations/F_Dances_007.glb",
    "/animations/F_Dances_006.glb",
    "/animations/M_Dances_006.glb",
    "/animations/M_Dances_001.glb",
    "/animations/M_Dances_011.glb",
    "/animations/M_Dances_004.glb",
  ];

  useEffect(() => {
    const loader = new GLTFLoader();

    const loadModelAndAnimations = async () => {
      try {
        for (const animUrl of animationUrls) {
          const animData = await loader.loadAsync(animUrl);
          // Add animation clips to the scene's animations array
          animData.animations.forEach((clip) => {
            scene.animations.push(clip);
          });
        }

        // Signal that animations have been added to the scene
        setAnimationsAdded(true);

      } catch (error) {
        console.error("Error loading animations:", error);
      }
    };

    loadModelAndAnimations();
  }, [scene]);

  // Only useAnimations when animations are added and the group is available
  const { actions, mixer } = useAnimations(
    animationsAdded ? scene.animations : [],
    group
  );


  /**
   * Character animations setup
   */
  let curAnimation = useGame((state) => state.curAnimation);
  const resetAnimation = useGame((state) => state.reset);
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );

  useEffect(() => {
    // Initialize animation set
    initializeAnimationSet(props.animationSet);
  }, []);

    const danceAnimations = [
    "F_Dances_001",
    "F_Dances_004",
    "F_Dances_007",
    "F_Dances_006",
    "M_Dances_006",
    "M_Dances_001",
    "M_Dances_011",
    "M_Dances_004",
  ];

   useEffect(() => {
    if (actions && animationsAdded && group.current) {
      
      // Play a default animation like 'idle' after animations are ready
      
      if(curAnimation === props.animationSet.action1)
        curAnimation = danceAnimations[Math.floor(Math.random() * danceAnimations.length)]
      
      const action = actions[curAnimation || props.animationSet.idle];
      if (action) {
        if (
      curAnimation === props.animationSet.jump ||
      curAnimation === props.animationSet.jumpLand ||
      curAnimation === props.animationSet.action1 ||
      curAnimation === props.animationSet.action2 ||
      curAnimation === props.animationSet.action3 ||
      curAnimation === props.animationSet.action4
    ) {

      
      action
        .reset()
        .fadeIn(0.2)
        .setLoop(THREE.LoopOnce, undefined as number)
        .play();
      action.clampWhenFinished = true;
    } else {
      action.reset().fadeIn(0.2).play();
    }
      }


      (action as any)._mixer.addEventListener("finished", () => resetAnimation());

      return () => {
      // Fade out previous action
      action.fadeOut(0.2);

      // Clean up mixer listener, and empty the _listeners array
      (action as any)._mixer.removeEventListener("finished", () =>
        resetAnimation()
      );
      (action as any)._mixer._listeners = [];
    };

    }
  }, [actions, animationsAdded, curAnimation]);

  return (
    <Suspense fallback={null}>
      <group ref={group} dispose={null} userData={{ camExcludeCollision: true }}>
        {/* Replace character model here */}
        {props.children}
      </group>
    </Suspense>
  );
}

export type EcctrlAnimationProps = {
  characterURL: string;
  animationSet: AnimationSet;
  children: React.ReactNode;
};
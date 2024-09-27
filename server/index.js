import { jsx, jsxs, Fragment } from "react/jsx-runtime";
import { PassThrough } from "node:stream";
import { createReadableStreamFromReadable } from "@remix-run/node";
import { RemixServer, Outlet, Meta, Links, ScrollRestoration, Scripts, useNavigate, useLocation } from "@remix-run/react";
import { isbot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";
import { AvatarCreator } from "@readyplayerme/react-avatar-creator";
import { useThree, useFrame, Canvas } from "@react-three/fiber";
import { useGLTF, useAnimations, useKeyboardControls, Environment, KeyboardControls } from "@react-three/drei";
import { useMemo, useEffect, useRef, useState, Suspense, forwardRef } from "react";
import { Box, CircularProgress, Typography, IconButton } from "@mui/material";
import { useRapier, RigidBody, CapsuleCollider, CylinderCollider, quat, Physics } from "@react-three/rapier";
import * as THREE from "three";
import { useControls } from "leva";
import create from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
const ABORT_DELAY = 5e3;
function handleRequest(request, responseStatusCode, responseHeaders, remixContext, loadContext) {
  return isbot(request.headers.get("user-agent") || "") ? handleBotRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  ) : handleBrowserRequest(
    request,
    responseStatusCode,
    responseHeaders,
    remixContext
  );
}
function handleBotRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onAllReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
function handleBrowserRequest(request, responseStatusCode, responseHeaders, remixContext) {
  return new Promise((resolve, reject) => {
    let shellRendered = false;
    const { pipe, abort } = renderToPipeableStream(
      /* @__PURE__ */ jsx(
        RemixServer,
        {
          context: remixContext,
          url: request.url,
          abortDelay: ABORT_DELAY
        }
      ),
      {
        onShellReady() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");
          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode
            })
          );
          pipe(body);
        },
        onShellError(error) {
          reject(error);
        },
        onError(error) {
          responseStatusCode = 500;
          if (shellRendered) {
            console.error(error);
          }
        }
      }
    );
    setTimeout(abort, ABORT_DELAY);
  });
}
const entryServer = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: handleRequest
}, Symbol.toStringTag, { value: "Module" }));
const links = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous"
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
  }
];
function Layout({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsxs("head", { children: [
      /* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
      /* @__PURE__ */ jsx("meta", { name: "viewport", content: "width=device-width, initial-scale=1" }),
      /* @__PURE__ */ jsx(Meta, {}),
      /* @__PURE__ */ jsx(Links, {})
    ] }),
    /* @__PURE__ */ jsxs("body", { children: [
      children,
      /* @__PURE__ */ jsx(ScrollRestoration, {}),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
function App$1() {
  return /* @__PURE__ */ jsx(Outlet, {});
}
const route0 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Layout,
  default: App$1,
  links
}, Symbol.toStringTag, { value: "Module" }));
const config = {
  clearCache: true,
  bodyType: "fullbody",
  quickStart: false,
  language: "en"
};
const style = { width: "100%", height: "100vh", border: "none" };
function App() {
  const navigate = useNavigate();
  const handleOnAvatarExported = (event) => {
    console.log(event.data.url);
    const avatarUrl = event.data.url;
    navigate("/home", { state: { avatarUrl } });
  };
  return /* @__PURE__ */ jsx(
    AvatarCreator,
    {
      subdomain: "avatar-creation-tool",
      config,
      style,
      onAvatarExported: handleOnAvatarExported
    }
  );
}
const route1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: App
}, Symbol.toStringTag, { value: "Module" }));
const useFollowCam = function(props) {
  const { scene, camera, gl } = useThree();
  const disableFollowCam = props.disableFollowCam;
  const disableFollowCamPos = props.disableFollowCamPos;
  const disableFollowCamTarget = props.disableFollowCamTarget;
  let isMouseDown = false;
  let previousTouch1 = null;
  let previousTouch2 = null;
  let originZDis = props.camInitDis;
  const camMaxDis = props.camMaxDis;
  const camMinDis = props.camMinDis;
  const camUpLimit = props.camUpLimit;
  const camLowLimit = props.camLowLimit;
  const camInitDir = props.camInitDir;
  const camMoveSpeed = props.camMoveSpeed;
  const camZoomSpeed = props.camZoomSpeed;
  const camCollisionOffset = props.camCollisionOffset;
  const camListenerTarget = props.camListenerTarget;
  const pivot = useMemo(() => new THREE.Object3D(), []);
  const followCam = useMemo(() => {
    const origin = new THREE.Object3D();
    origin.position.set(
      0,
      originZDis * Math.sin(-camInitDir.x),
      originZDis * Math.cos(-camInitDir.x)
    );
    return origin;
  }, []);
  let smallestDistance = null;
  let cameraDistance = null;
  let intersects = null;
  let intersectObjects = [];
  const cameraRayDir = useMemo(() => new THREE.Vector3(), []);
  const cameraRayOrigin = useMemo(() => new THREE.Vector3(), []);
  const cameraPosition = useMemo(() => new THREE.Vector3(), []);
  const camLerpingPoint = useMemo(() => new THREE.Vector3(), []);
  const camRayCast = new THREE.Raycaster(
    cameraRayOrigin,
    cameraRayDir,
    0,
    -camMaxDis
  );
  const onDocumentMouseMove = (e) => {
    if (document.pointerLockElement || isMouseDown) {
      pivot.rotation.y -= e.movementX * 2e-3 * camMoveSpeed;
      const vy = followCam.rotation.x + e.movementY * 2e-3 * camMoveSpeed;
      cameraDistance = followCam.position.length();
      if (vy >= camLowLimit && vy <= camUpLimit) {
        followCam.rotation.x = vy;
        followCam.position.y = -cameraDistance * Math.sin(-vy);
        followCam.position.z = -cameraDistance * Math.cos(-vy);
      }
    }
    return false;
  };
  const onDocumentMouseWheel = (e) => {
    const vz = originZDis - e.deltaY * 2e-3 * camZoomSpeed;
    const vy = followCam.rotation.x;
    if (vz >= camMaxDis && vz <= camMinDis) {
      originZDis = vz;
      followCam.position.z = originZDis * Math.cos(-vy);
      followCam.position.y = originZDis * Math.sin(-vy);
    }
    return false;
  };
  const onTouchEnd = (e) => {
    previousTouch1 = null;
    previousTouch2 = null;
  };
  const onTouchMove = (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    const touch1 = e.targetTouches[0];
    const touch2 = e.targetTouches[1];
    if (previousTouch1 && !previousTouch2) {
      const touch1MovementX = touch1.pageX - previousTouch1.pageX;
      const touch1MovementY = touch1.pageY - previousTouch1.pageY;
      pivot.rotation.y -= touch1MovementX * 5e-3 * camMoveSpeed;
      const vy = followCam.rotation.x + touch1MovementY * 5e-3 * camMoveSpeed;
      cameraDistance = followCam.position.length();
      if (vy >= camLowLimit && vy <= camUpLimit) {
        followCam.rotation.x = vy;
        followCam.position.y = -cameraDistance * Math.sin(-vy);
        followCam.position.z = -cameraDistance * Math.cos(-vy);
      }
    }
    if (previousTouch2) {
      const prePinchDis = Math.hypot(
        previousTouch1.pageX - previousTouch2.pageX,
        previousTouch1.pageY - previousTouch2.pageY
      );
      const pinchDis = Math.hypot(
        e.touches[0].pageX - e.touches[1].pageX,
        e.touches[0].pageY - e.touches[1].pageY
      );
      const vz = originZDis - (prePinchDis - pinchDis) * 0.01 * camZoomSpeed;
      const vy = followCam.rotation.x;
      if (vz >= camMaxDis && vz <= camMinDis) {
        originZDis = vz;
        followCam.position.z = originZDis * Math.cos(-vy);
        followCam.position.y = originZDis * Math.sin(-vy);
      }
    }
    previousTouch1 = touch1;
    previousTouch2 = touch2;
  };
  const joystickCamMove = (movementX, movementY) => {
    pivot.rotation.y -= movementX * 5e-3 * camMoveSpeed * 5;
    const vy = followCam.rotation.x + movementY * 5e-3 * camMoveSpeed * 5;
    cameraDistance = followCam.position.length();
    if (vy >= camLowLimit && vy <= camUpLimit) {
      followCam.rotation.x = vy;
      followCam.position.y = -cameraDistance * Math.sin(-vy);
      followCam.position.z = -cameraDistance * Math.cos(vy);
    }
  };
  function customTraverse(object) {
    if (object.userData && object.userData.camExcludeCollision === true) {
      return;
    }
    if (object.isMesh && object.geometry.type !== "InstancedBufferGeometry") {
      intersectObjects.push(object);
    }
    object.children.forEach((child) => {
      customTraverse(child);
    });
  }
  const cameraCollisionDetect = (delta) => {
    cameraRayOrigin.copy(pivot.position);
    camera.getWorldPosition(cameraPosition);
    cameraRayDir.subVectors(cameraPosition, pivot.position);
    intersects = camRayCast.intersectObjects(intersectObjects);
    if (intersects.length && intersects[0].distance <= -originZDis) {
      smallestDistance = -intersects[0].distance * camCollisionOffset < -0.7 ? -intersects[0].distance * camCollisionOffset : -0.7;
    } else {
      smallestDistance = originZDis;
    }
    camLerpingPoint.set(
      followCam.position.x,
      smallestDistance * Math.sin(-followCam.rotation.x),
      smallestDistance * Math.cos(-followCam.rotation.x)
    );
    followCam.position.lerp(camLerpingPoint, delta * 4);
  };
  useEffect(() => {
    pivot.rotation.y = camInitDir.y;
    followCam.rotation.x = camInitDir.x;
  }, []);
  useEffect(() => {
    if (disableFollowCam) {
      if (disableFollowCamPos) camera.position.set(disableFollowCamPos.x, disableFollowCamPos.y, disableFollowCamPos.z);
      if (disableFollowCamTarget) camera.lookAt(new THREE.Vector3(disableFollowCamTarget.x, disableFollowCamTarget.y, disableFollowCamTarget.z));
    }
  }, [disableFollowCam]);
  useEffect(() => {
    scene.children.forEach((child) => customTraverse(child));
    pivot.add(followCam);
    scene.add(pivot);
    if (camListenerTarget === "domElement") {
      gl.domElement.addEventListener("mousedown", () => {
        isMouseDown = true;
      });
      gl.domElement.addEventListener("mouseup", () => {
        isMouseDown = false;
      });
      gl.domElement.addEventListener("mousemove", onDocumentMouseMove);
      gl.domElement.addEventListener("mousewheel", onDocumentMouseWheel);
      gl.domElement.addEventListener("touchend", onTouchEnd);
      gl.domElement.addEventListener("touchmove", onTouchMove, { passive: false });
    } else if (camListenerTarget === "document") {
      document.addEventListener("mousedown", () => {
        isMouseDown = true;
      });
      document.addEventListener("mouseup", () => {
        isMouseDown = false;
      });
      document.addEventListener("mousemove", onDocumentMouseMove);
      document.addEventListener("mousewheel", onDocumentMouseWheel);
      document.addEventListener("touchend", onTouchEnd);
      document.addEventListener("touchmove", onTouchMove, { passive: false });
    }
    return () => {
      if (camListenerTarget === "domElement") {
        gl.domElement.removeEventListener("mousedown", () => {
          isMouseDown = true;
        });
        gl.domElement.removeEventListener("mouseup", () => {
          isMouseDown = false;
        });
        gl.domElement.removeEventListener("mousemove", onDocumentMouseMove);
        gl.domElement.removeEventListener("mousewheel", onDocumentMouseWheel);
        gl.domElement.removeEventListener("touchend", onTouchEnd);
        gl.domElement.removeEventListener("touchmove", onTouchMove);
      } else if (camListenerTarget === "document") {
        document.removeEventListener("mousedown", () => {
          isMouseDown = true;
        });
        document.removeEventListener("mouseup", () => {
          isMouseDown = false;
        });
        document.removeEventListener("mousemove", onDocumentMouseMove);
        document.removeEventListener("mousewheel", onDocumentMouseWheel);
        document.removeEventListener("touchend", onTouchEnd);
        document.removeEventListener("touchmove", onTouchMove);
      }
    };
  });
  return { pivot, followCam, cameraCollisionDetect, joystickCamMove };
};
const useGame = /* @__PURE__ */ create(
  /* @__PURE__ */ subscribeWithSelector((set, get) => {
    return {
      /**
       * Point to move point
       */
      moveToPoint: null,
      /**
       * Character animations state manegement
       */
      // Initial animation
      curAnimation: null,
      animationSet: {},
      initializeAnimationSet: (animationSet) => {
        set((state) => {
          if (Object.keys(state.animationSet).length === 0) {
            return { animationSet };
          }
          return {};
        });
      },
      reset: () => {
        set((state) => {
          return { curAnimation: state.animationSet.idle };
        });
      },
      idle: () => {
        set((state) => {
          if (state.curAnimation === state.animationSet.jumpIdle) {
            return { curAnimation: state.animationSet.jumpLand };
          } else if (state.curAnimation !== state.animationSet.action1 && state.curAnimation !== state.animationSet.action2 && state.curAnimation !== state.animationSet.action3 && state.curAnimation !== state.animationSet.action4) {
            return { curAnimation: state.animationSet.idle };
          }
          return {};
        });
      },
      walk: () => {
        set((state) => {
          if (state.curAnimation !== state.animationSet.action4) {
            return { curAnimation: state.animationSet.walk };
          }
          return {};
        });
      },
      run: () => {
        set((state) => {
          if (state.curAnimation !== state.animationSet.action4) {
            return { curAnimation: state.animationSet.run };
          }
          return {};
        });
      },
      jump: () => {
        set((state) => {
          return { curAnimation: state.animationSet.jump };
        });
      },
      jumpIdle: () => {
        set((state) => {
          if (state.curAnimation === state.animationSet.jump) {
            return { curAnimation: state.animationSet.jumpIdle };
          }
          return {};
        });
      },
      jumpLand: () => {
        set((state) => {
          if (state.curAnimation === state.animationSet.jumpIdle) {
            return { curAnimation: state.animationSet.jumpLand };
          }
          return {};
        });
      },
      fall: () => {
        set((state) => {
          return { curAnimation: state.animationSet.fall };
        });
      },
      action1: () => {
        set((state) => {
          if (state.curAnimation === state.animationSet.idle) {
            return { curAnimation: state.animationSet.action1 };
          }
          return {};
        });
      },
      action2: () => {
        set((state) => {
          if (state.curAnimation === state.animationSet.idle) {
            return { curAnimation: state.animationSet.action2 };
          }
          return {};
        });
      },
      action3: () => {
        set((state) => {
          if (state.curAnimation === state.animationSet.idle) {
            return { curAnimation: state.animationSet.action3 };
          }
          return {};
        });
      },
      action4: () => {
        set((state) => {
          if (state.curAnimation === state.animationSet.idle || state.curAnimation === state.animationSet.walk || state.curAnimation === state.animationSet.run) {
            return { curAnimation: state.animationSet.action4 };
          }
          return {};
        });
      },
      /**
       * Additional animations
       */
      // triggerFunction: ()=>{
      //    set((state) => {
      //        return { curAnimation: state.animationSet.additionalAnimation };
      //    });
      // }
      /**
       * Set/get point to move point
       */
      setMoveToPoint: (point) => {
        set(() => {
          return { moveToPoint: point };
        });
      },
      getMoveToPoint: () => {
        return {
          moveToPoint: get().moveToPoint
        };
      }
    };
  })
);
const useJoystickControls = /* @__PURE__ */ create(
  /* @__PURE__ */ subscribeWithSelector((set, get) => {
    return {
      /**
       * Joystick state manegement
       */
      // Initial joystick/button state
      curJoystickDis: 0,
      curJoystickAng: 0,
      curRunState: false,
      curButton1Pressed: false,
      curButton2Pressed: false,
      curButton3Pressed: false,
      curButton4Pressed: false,
      curButton5Pressed: false,
      setJoystick: (joystickDis, joystickAng, runState) => {
        set(() => {
          return {
            curJoystickDis: joystickDis,
            curJoystickAng: joystickAng,
            curRunState: runState
          };
        });
      },
      resetJoystick: () => {
        set((state) => {
          if (state.curJoystickDis !== 0 || state.curJoystickAng !== 0) {
            return {
              curJoystickDis: 0,
              curJoystickAng: 0,
              curRunState: false
            };
          }
          return {};
        });
      },
      pressButton1: () => {
        set((state) => {
          if (!state.curButton1Pressed) {
            return {
              curButton1Pressed: true
            };
          }
          return {};
        });
      },
      pressButton2: () => {
        set((state) => {
          if (!state.curButton2Pressed) {
            return {
              curButton2Pressed: true
            };
          }
          return {};
        });
      },
      pressButton3: () => {
        set((state) => {
          if (!state.curButton3Pressed) {
            return {
              curButton3Pressed: true
            };
          }
          return {};
        });
      },
      pressButton4: () => {
        set((state) => {
          if (!state.curButton4Pressed) {
            return {
              curButton4Pressed: true
            };
          }
          return {};
        });
      },
      pressButton5: () => {
        set((state) => {
          if (!state.curButton5Pressed) {
            return {
              curButton5Pressed: true
            };
          }
          return {};
        });
      },
      releaseAllButtons: () => {
        set((state) => {
          if (state.curButton1Pressed) {
            return {
              curButton1Pressed: false
            };
          }
          if (state.curButton2Pressed) {
            return {
              curButton2Pressed: false
            };
          }
          if (state.curButton3Pressed) {
            return {
              curButton3Pressed: false
            };
          }
          if (state.curButton4Pressed) {
            return {
              curButton4Pressed: false
            };
          }
          if (state.curButton5Pressed) {
            return {
              curButton5Pressed: false
            };
          }
          return {};
        });
      },
      getJoystickValues: () => {
        return {
          joystickDis: get().curJoystickDis,
          joystickAng: get().curJoystickAng,
          runState: get().curRunState,
          button1Pressed: get().curButton1Pressed,
          button2Pressed: get().curButton2Pressed,
          button3Pressed: get().curButton3Pressed,
          button4Pressed: get().curButton4Pressed,
          button5Pressed: get().curButton5Pressed
        };
      }
    };
  })
);
function EcctrlAnimation(props) {
  const group = useRef();
  const { scene } = useGLTF(props.characterURL);
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
    "/animations/M_Dances_004.glb"
  ];
  useEffect(() => {
    const loader = new GLTFLoader();
    const loadModelAndAnimations = async () => {
      try {
        for (const animUrl of animationUrls) {
          const animData = await loader.loadAsync(animUrl);
          animData.animations.forEach((clip) => {
            scene.animations.push(clip);
          });
        }
        setAnimationsAdded(true);
      } catch (error) {
        console.error("Error loading animations:", error);
      }
    };
    loadModelAndAnimations();
  }, [scene]);
  const { actions, mixer } = useAnimations(
    animationsAdded ? scene.animations : [],
    group
  );
  let curAnimation = useGame((state) => state.curAnimation);
  const resetAnimation = useGame((state) => state.reset);
  const initializeAnimationSet = useGame(
    (state) => state.initializeAnimationSet
  );
  useEffect(() => {
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
    "M_Dances_004"
  ];
  useEffect(() => {
    if (actions && animationsAdded && group.current) {
      if (curAnimation === props.animationSet.action1)
        curAnimation = danceAnimations[Math.floor(Math.random() * danceAnimations.length)];
      const action = actions[curAnimation || props.animationSet.idle];
      if (action) {
        if (curAnimation === props.animationSet.jump || curAnimation === props.animationSet.jumpLand || curAnimation === props.animationSet.action1 || curAnimation === props.animationSet.action2 || curAnimation === props.animationSet.action3 || curAnimation === props.animationSet.action4) {
          action.reset().fadeIn(0.2).setLoop(THREE.LoopOnce, void 0).play();
          action.clampWhenFinished = true;
        } else {
          action.reset().fadeIn(0.2).play();
        }
      }
      action._mixer.addEventListener("finished", () => resetAnimation());
      return () => {
        action.fadeOut(0.2);
        action._mixer.removeEventListener(
          "finished",
          () => resetAnimation()
        );
        action._mixer._listeners = [];
      };
    }
  }, [actions, animationsAdded, curAnimation]);
  return /* @__PURE__ */ jsx(Suspense, { fallback: null, children: /* @__PURE__ */ jsx("group", { ref: group, dispose: null, userData: { camExcludeCollision: true }, children: props.children }) });
}
const getMovingDirection = (forward, backward, leftward, rightward, pivot) => {
  if (!forward && !backward && !leftward && !rightward) return null;
  if (forward && leftward) return pivot.rotation.y + Math.PI / 4;
  if (forward && rightward) return pivot.rotation.y - Math.PI / 4;
  if (backward && leftward) return pivot.rotation.y - Math.PI / 4 + Math.PI;
  if (backward && rightward) return pivot.rotation.y + Math.PI / 4 + Math.PI;
  if (backward) return pivot.rotation.y + Math.PI;
  if (leftward) return pivot.rotation.y + Math.PI / 2;
  if (rightward) return pivot.rotation.y - Math.PI / 2;
  if (forward) return pivot.rotation.y;
};
const Ecctrl = ({
  children,
  debug = false,
  capsuleHalfHeight = 0.35,
  capsuleRadius = 0.3,
  floatHeight = 0.3,
  characterInitDir = 0,
  // in rad
  followLight = false,
  disableControl = false,
  disableFollowCam = false,
  disableFollowCamPos = null,
  disableFollowCamTarget = null,
  // Follow camera setups
  camInitDis = -5,
  camMaxDis = -7,
  camMinDis = -0.7,
  camUpLimit = 1.5,
  // in rad
  camLowLimit = -1.3,
  // in rad
  camInitDir = { x: 0, y: 0 },
  // in rad
  camTargetPos = { x: 0, y: 0, z: 0 },
  camMoveSpeed = 1,
  camZoomSpeed = 1,
  camCollision = true,
  camCollisionOffset = 0.7,
  fixedCamRotMult = 1,
  camListenerTarget = "domElement",
  // document or domElement
  // Follow light setups
  followLightPos = { x: 20, y: 30, z: 10 },
  // Base control setups
  maxVelLimit = 2.5,
  turnVelMultiplier = 0.2,
  turnSpeed = 15,
  sprintMult = 2,
  jumpVel = 4,
  jumpForceToGroundMult = 5,
  slopJumpMult = 0.25,
  sprintJumpMult = 1.2,
  airDragMultiplier = 0.2,
  dragDampingC = 0.15,
  accDeltaTime = 8,
  rejectVelMult = 4,
  moveImpulsePointY = 0.5,
  camFollowMult = 11,
  camLerpMult = 25,
  fallingGravityScale = 2.5,
  fallingMaxVel = -20,
  wakeUpDelay = 200,
  // Floating Ray setups
  rayOriginOffest = { x: 0, y: -capsuleHalfHeight, z: 0 },
  rayHitForgiveness = 0.1,
  rayLength = capsuleRadius + 2,
  rayDir = { x: 0, y: -1, z: 0 },
  floatingDis = capsuleRadius + floatHeight,
  springK = 1.2,
  dampingC = 0.08,
  // Slope Ray setups
  showSlopeRayOrigin = false,
  slopeMaxAngle = 1,
  // in rad
  slopeRayOriginOffest = capsuleRadius - 0.03,
  slopeRayLength = capsuleRadius + 3,
  slopeRayDir = { x: 0, y: -1, z: 0 },
  slopeUpExtraForce = 0.1,
  slopeDownExtraForce = 0.2,
  // AutoBalance Force setups
  autoBalance = true,
  autoBalanceSpringK = 0.3,
  autoBalanceDampingC = 0.03,
  autoBalanceSpringOnY = 0.5,
  autoBalanceDampingOnY = 0.015,
  // Animation temporary setups
  animated = false,
  // Mode setups
  mode: mode2 = null,
  // Controller setups
  controllerKeys = { forward: 12, backward: 13, leftward: 14, rightward: 15, jump: 2, action1: 11, action2: 3, action3: 1, action4: 0 },
  // Other rigibody props from parent
  ...props
}, ref) => {
  const characterRef = ref || useRef();
  const characterModelRef = useRef();
  const characterModelIndicator = useMemo(() => new THREE.Object3D(), []);
  const defaultControllerKeys = { forward: 12, backward: 13, leftward: 14, rightward: 15, jump: 2, action1: 11, action2: 3, action3: 1, action4: 0 };
  let isModePointToMove = false;
  let functionKeyDown = false;
  let isModeFixedCamera = false;
  let isModeCameraBased = false;
  const setMoveToPoint = useGame((state) => state.setMoveToPoint);
  const findMode = (mode22, modes) => modes.split(" ").some((m) => m === mode22);
  if (mode2) {
    if (findMode("PointToMove", mode2)) isModePointToMove = true;
    if (findMode("FixedCamera", mode2)) isModeFixedCamera = true;
    if (findMode("CameraBasedMovement", mode2)) isModeCameraBased = true;
  }
  const modelFacingVec = useMemo(() => new THREE.Vector3(), []);
  const bodyFacingVec = useMemo(() => new THREE.Vector3(), []);
  const bodyBalanceVec = useMemo(() => new THREE.Vector3(), []);
  const bodyBalanceVecOnX = useMemo(() => new THREE.Vector3(), []);
  const bodyFacingVecOnY = useMemo(() => new THREE.Vector3(), []);
  const bodyBalanceVecOnZ = useMemo(() => new THREE.Vector3(), []);
  const vectorY = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const vectorZ = useMemo(() => new THREE.Vector3(0, 0, 1), []);
  const crossVecOnX = useMemo(() => new THREE.Vector3(), []);
  const crossVecOnY = useMemo(() => new THREE.Vector3(), []);
  const crossVecOnZ = useMemo(() => new THREE.Vector3(), []);
  const bodyContactForce = useMemo(() => new THREE.Vector3(), []);
  const slopeRayOriginUpdatePosition = useMemo(() => new THREE.Vector3(), []);
  const camBasedMoveCrossVecOnY = useMemo(() => new THREE.Vector3(), []);
  const idleAnimation = !animated ? null : useGame((state) => state.idle);
  const walkAnimation = !animated ? null : useGame((state) => state.walk);
  const runAnimation = !animated ? null : useGame((state) => state.run);
  const jumpAnimation = !animated ? null : useGame((state) => state.jump);
  const jumpIdleAnimation = !animated ? null : useGame((state) => state.jumpIdle);
  const fallAnimation = !animated ? null : useGame((state) => state.fall);
  const action1Animation = !animated ? null : useGame((state) => state.action1);
  const action2Animation = !animated ? null : useGame((state) => state.action2);
  const action3Animation = !animated ? null : useGame((state) => state.action3);
  const action4Animation = !animated ? null : useGame((state) => state.action4);
  let characterControlsDebug = null;
  let floatingRayDebug = null;
  let slopeRayDebug = null;
  let autoBalanceForceDebug = null;
  if (debug) {
    characterControlsDebug = useControls(
      "Character Controls",
      {
        maxVelLimit: {
          value: maxVelLimit,
          min: 0,
          max: 10,
          step: 0.01
        },
        turnVelMultiplier: {
          value: turnVelMultiplier,
          min: 0,
          max: 1,
          step: 0.01
        },
        turnSpeed: {
          value: turnSpeed,
          min: 5,
          max: 30,
          step: 0.1
        },
        sprintMult: {
          value: sprintMult,
          min: 1,
          max: 5,
          step: 0.01
        },
        jumpVel: {
          value: jumpVel,
          min: 0,
          max: 10,
          step: 0.01
        },
        jumpForceToGroundMult: {
          value: jumpForceToGroundMult,
          min: 0,
          max: 80,
          step: 0.1
        },
        slopJumpMult: {
          value: slopJumpMult,
          min: 0,
          max: 1,
          step: 0.01
        },
        sprintJumpMult: {
          value: sprintJumpMult,
          min: 1,
          max: 3,
          step: 0.01
        },
        airDragMultiplier: {
          value: airDragMultiplier,
          min: 0,
          max: 1,
          step: 0.01
        },
        dragDampingC: {
          value: dragDampingC,
          min: 0,
          max: 0.5,
          step: 0.01
        },
        accDeltaTime: {
          value: accDeltaTime,
          min: 0,
          max: 50,
          step: 1
        },
        rejectVelMult: {
          value: rejectVelMult,
          min: 0,
          max: 10,
          step: 0.1
        },
        moveImpulsePointY: {
          value: moveImpulsePointY,
          min: 0,
          max: 3,
          step: 0.1
        },
        camFollowMult: {
          value: camFollowMult,
          min: 0,
          max: 15,
          step: 0.1
        }
      },
      { collapsed: true }
    );
    maxVelLimit = characterControlsDebug.maxVelLimit;
    turnVelMultiplier = characterControlsDebug.turnVelMultiplier;
    turnSpeed = characterControlsDebug.turnSpeed;
    sprintMult = characterControlsDebug.sprintMult;
    jumpVel = characterControlsDebug.jumpVel;
    jumpForceToGroundMult = characterControlsDebug.jumpForceToGroundMult;
    slopJumpMult = characterControlsDebug.slopJumpMult;
    sprintJumpMult = characterControlsDebug.sprintJumpMult;
    airDragMultiplier = characterControlsDebug.airDragMultiplier;
    dragDampingC = characterControlsDebug.dragDampingC;
    accDeltaTime = characterControlsDebug.accDeltaTime;
    rejectVelMult = characterControlsDebug.rejectVelMult;
    moveImpulsePointY = characterControlsDebug.moveImpulsePointY;
    camFollowMult = characterControlsDebug.camFollowMult;
    floatingRayDebug = useControls(
      "Floating Ray",
      {
        rayOriginOffest: {
          x: 0,
          y: -capsuleHalfHeight,
          z: 0
        },
        rayHitForgiveness: {
          value: rayHitForgiveness,
          min: 0,
          max: 0.5,
          step: 0.01
        },
        rayLength: {
          value: capsuleRadius + 2,
          min: 0,
          max: capsuleRadius + 10,
          step: 0.01
        },
        rayDir: { x: 0, y: -1, z: 0 },
        floatingDis: {
          value: capsuleRadius + floatHeight,
          min: 0,
          max: capsuleRadius + 2,
          step: 0.01
        },
        springK: {
          value: springK,
          min: 0,
          max: 5,
          step: 0.01
        },
        dampingC: {
          value: dampingC,
          min: 0,
          max: 3,
          step: 0.01
        }
      },
      { collapsed: true }
    );
    rayOriginOffest = floatingRayDebug.rayOriginOffest;
    rayHitForgiveness = floatingRayDebug.rayHitForgiveness;
    rayLength = floatingRayDebug.rayLength;
    rayDir = floatingRayDebug.rayDir;
    floatingDis = floatingRayDebug.floatingDis;
    springK = floatingRayDebug.springK;
    dampingC = floatingRayDebug.dampingC;
    slopeRayDebug = useControls(
      "Slope Ray",
      {
        showSlopeRayOrigin: false,
        slopeMaxAngle: {
          value: slopeMaxAngle,
          min: 0,
          max: 1.57,
          step: 0.01
        },
        slopeRayOriginOffest: {
          value: capsuleRadius,
          min: 0,
          max: capsuleRadius + 3,
          step: 0.01
        },
        slopeRayLength: {
          value: capsuleRadius + 3,
          min: 0,
          max: capsuleRadius + 13,
          step: 0.01
        },
        slopeRayDir: { x: 0, y: -1, z: 0 },
        slopeUpExtraForce: {
          value: slopeUpExtraForce,
          min: 0,
          max: 5,
          step: 0.01
        },
        slopeDownExtraForce: {
          value: slopeDownExtraForce,
          min: 0,
          max: 5,
          step: 0.01
        }
      },
      { collapsed: true }
    );
    showSlopeRayOrigin = slopeRayDebug.showSlopeRayOrigin;
    slopeMaxAngle = slopeRayDebug.slopeMaxAngle;
    slopeRayLength = slopeRayDebug.slopeRayLength;
    slopeRayDir = slopeRayDebug.slopeRayDir;
    slopeUpExtraForce = slopeRayDebug.slopeUpExtraForce;
    slopeDownExtraForce = slopeRayDebug.slopeDownExtraForce;
    autoBalanceForceDebug = useControls(
      "AutoBalance Force",
      {
        autoBalance: {
          value: true
        },
        autoBalanceSpringK: {
          value: autoBalanceSpringK,
          min: 0,
          max: 5,
          step: 0.01
        },
        autoBalanceDampingC: {
          value: autoBalanceDampingC,
          min: 0,
          max: 0.1,
          step: 1e-3
        },
        autoBalanceSpringOnY: {
          value: autoBalanceSpringOnY,
          min: 0,
          max: 5,
          step: 0.01
        },
        autoBalanceDampingOnY: {
          value: autoBalanceDampingOnY,
          min: 0,
          max: 0.1,
          step: 1e-3
        }
      },
      { collapsed: true }
    );
    autoBalance = autoBalanceForceDebug.autoBalance;
    autoBalanceSpringK = autoBalanceForceDebug.autoBalanceSpringK;
    autoBalanceDampingC = autoBalanceForceDebug.autoBalanceDampingC;
    autoBalanceSpringOnY = autoBalanceForceDebug.autoBalanceSpringOnY;
    autoBalanceDampingOnY = autoBalanceForceDebug.autoBalanceDampingOnY;
  }
  function useIsInsideKeyboardControls() {
    try {
      return !!useKeyboardControls();
    } catch {
      return false;
    }
  }
  const isInsideKeyboardControls = useIsInsideKeyboardControls();
  const [subscribeKeys, getKeys] = isInsideKeyboardControls ? useKeyboardControls() : [null];
  const presetKeys = { forward: false, backward: false, leftward: false, rightward: false, jump: false, run: false };
  const { rapier, world } = useRapier();
  const getJoystickValues = useJoystickControls((state) => state.getJoystickValues);
  const pressButton1 = useJoystickControls((state) => state.pressButton1);
  const pressButton2 = useJoystickControls((state) => state.pressButton2);
  const pressButton3 = useJoystickControls((state) => state.pressButton3);
  const pressButton4 = useJoystickControls((state) => state.pressButton4);
  const pressButton5 = useJoystickControls((state) => state.pressButton5);
  const releaseAllButtons = useJoystickControls((state) => state.releaseAllButtons);
  const setJoystick = useJoystickControls((state) => state.setJoystick);
  const resetJoystick = useJoystickControls((state) => state.resetJoystick);
  const [controllerIndex, setControllerIndex] = useState(null);
  const gamepadKeys = { forward: false, backward: false, leftward: false, rightward: false };
  const gamepadJoystickVec2 = useMemo(() => new THREE.Vector2(), []);
  let gamepadJoystickDis = 0;
  let gamepadJoystickAng = 0;
  const gamepadConnect = (e) => {
    setControllerIndex(e.gamepad.index);
  };
  const gamepadDisconnect = () => {
    setControllerIndex(null);
  };
  const mergedKeys = useMemo(() => Object.assign({}, defaultControllerKeys, controllerKeys), [controllerKeys]);
  const handleButtons = (buttons) => {
    gamepadKeys.forward = buttons[mergedKeys.forward].pressed;
    gamepadKeys.backward = buttons[mergedKeys.backward].pressed;
    gamepadKeys.leftward = buttons[mergedKeys.leftward].pressed;
    gamepadKeys.rightward = buttons[mergedKeys.rightward].pressed;
    if (buttons[mergedKeys.action4].pressed) {
      pressButton2();
    } else if (buttons[mergedKeys.action3].pressed) {
      pressButton4();
    } else if (buttons[mergedKeys.jump].pressed) {
      pressButton1();
    } else if (buttons[mergedKeys.action2].pressed) {
      pressButton3();
    } else if (buttons[mergedKeys.action1].pressed) {
      pressButton5();
    } else {
      releaseAllButtons();
    }
  };
  const handleSticks = (axes) => {
    if (Math.abs(axes[0]) > 0 || Math.abs(axes[1]) > 0) {
      gamepadJoystickVec2.set(axes[0], -axes[1]);
      gamepadJoystickDis = Math.min(Math.sqrt(Math.pow(gamepadJoystickVec2.x, 2) + Math.pow(gamepadJoystickVec2.y, 2)), 1);
      gamepadJoystickAng = gamepadJoystickVec2.angle();
      const runState = gamepadJoystickDis > 0.7;
      setJoystick(gamepadJoystickDis, gamepadJoystickAng, runState);
    } else {
      gamepadJoystickDis = 0;
      gamepadJoystickAng = 0;
      resetJoystick();
    }
    if (Math.abs(axes[2]) > 0 || Math.abs(axes[3]) > 0) {
      joystickCamMove(axes[2], axes[3]);
    }
  };
  let canJump = false;
  let isFalling = false;
  const initialGravityScale = useMemo(() => props.gravityScale || 1, []);
  let massRatio = 1;
  let isOnMovingObject = false;
  const standingForcePoint = useMemo(() => new THREE.Vector3(), []);
  const movingObjectDragForce = useMemo(() => new THREE.Vector3(), []);
  const movingObjectVelocity = useMemo(() => new THREE.Vector3(), []);
  const movingObjectVelocityInCharacterDir = useMemo(() => new THREE.Vector3(), []);
  const distanceFromCharacterToObject = useMemo(() => new THREE.Vector3(), []);
  const objectAngvelToLinvel = useMemo(() => new THREE.Vector3(), []);
  const velocityDiff = useMemo(() => new THREE.Vector3(), []);
  let dirLight = null;
  const cameraSetups = {
    disableFollowCam,
    disableFollowCamPos,
    disableFollowCamTarget,
    camInitDis,
    camMaxDis,
    camMinDis,
    camUpLimit,
    camLowLimit,
    camInitDir,
    camMoveSpeed: isModeFixedCamera ? 0 : camMoveSpeed,
    // Disable camera move in fixed camera mode
    camZoomSpeed: isModeFixedCamera ? 0 : camZoomSpeed,
    // Disable camera zoom in fixed camera mode
    camCollisionOffset,
    camListenerTarget
  };
  const { pivot, followCam, cameraCollisionDetect, joystickCamMove } = useFollowCam(cameraSetups);
  const pivotPosition = useMemo(() => new THREE.Vector3(), []);
  const followCamPosition = useMemo(() => new THREE.Vector3(), []);
  const modelEuler = useMemo(() => new THREE.Euler(), []);
  const modelQuat = useMemo(() => new THREE.Quaternion(), []);
  const moveImpulse = useMemo(() => new THREE.Vector3(), []);
  const movingDirection = useMemo(() => new THREE.Vector3(), []);
  const moveAccNeeded = useMemo(() => new THREE.Vector3(), []);
  const jumpVelocityVec = useMemo(() => new THREE.Vector3(), []);
  const jumpDirection = useMemo(() => new THREE.Vector3(), []);
  const currentVel = useMemo(() => new THREE.Vector3(), []);
  const currentPos = useMemo(() => new THREE.Vector3(), []);
  const dragForce = useMemo(() => new THREE.Vector3(), []);
  const dragAngForce = useMemo(() => new THREE.Vector3(), []);
  const wantToMoveVel = useMemo(() => new THREE.Vector3(), []);
  const rejectVel = useMemo(() => new THREE.Vector3(), []);
  let floatingForce = null;
  const springDirVec = useMemo(() => new THREE.Vector3(), []);
  const characterMassForce = useMemo(() => new THREE.Vector3(), []);
  const rayOrigin = useMemo(() => new THREE.Vector3(), []);
  const rayCast = new rapier.Ray(rayOrigin, rayDir);
  let rayHit = null;
  let slopeAngle = null;
  let actualSlopeNormal = null;
  let actualSlopeAngle = null;
  const actualSlopeNormalVec = useMemo(() => new THREE.Vector3(), []);
  const floorNormal = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const slopeRayOriginRef = useRef();
  const slopeRayorigin = useMemo(() => new THREE.Vector3(), []);
  const slopeRayCast = new rapier.Ray(slopeRayorigin, slopeRayDir);
  let slopeRayHit = null;
  let isBodyHitWall = false;
  let isPointMoving = false;
  const crossVector = useMemo(() => new THREE.Vector3(), []);
  const pointToPoint = useMemo(() => new THREE.Vector3(), []);
  const getMoveToPoint = useGame((state) => state.getMoveToPoint);
  const bodySensorRef = useRef();
  const handleOnIntersectionEnter = () => {
    isBodyHitWall = true;
  };
  const handleOnIntersectionExit = () => {
    isBodyHitWall = false;
  };
  let characterRotated = true;
  const moveCharacter = (_, run, slopeAngle2, movingObjectVelocity2) => {
    if (actualSlopeAngle < slopeMaxAngle && Math.abs(slopeAngle2) > 0.2 && Math.abs(slopeAngle2) < slopeMaxAngle) {
      movingDirection.set(0, Math.sin(slopeAngle2), Math.cos(slopeAngle2));
    } else if (actualSlopeAngle >= slopeMaxAngle) {
      movingDirection.set(
        0,
        Math.sin(slopeAngle2) > 0 ? 0 : Math.sin(slopeAngle2),
        Math.sin(slopeAngle2) > 0 ? 0.1 : 1
      );
    } else {
      movingDirection.set(0, 0, 1);
    }
    movingDirection.applyQuaternion(characterModelIndicator.quaternion);
    movingObjectVelocityInCharacterDir.copy(movingObjectVelocity2).projectOnVector(movingDirection).multiply(movingDirection);
    const angleBetweenCharacterDirAndObjectDir = movingObjectVelocity2.angleTo(movingDirection);
    const wantToMoveMeg = currentVel.dot(movingDirection);
    wantToMoveVel.set(
      movingDirection.x * wantToMoveMeg,
      0,
      movingDirection.z * wantToMoveMeg
    );
    rejectVel.copy(currentVel).sub(wantToMoveVel);
    moveAccNeeded.set(
      (movingDirection.x * (maxVelLimit * (run ? sprintMult : 1) + movingObjectVelocityInCharacterDir.x) - (currentVel.x - movingObjectVelocity2.x * Math.sin(angleBetweenCharacterDirAndObjectDir) + rejectVel.x * (isOnMovingObject ? 0 : rejectVelMult))) / accDeltaTime,
      0,
      (movingDirection.z * (maxVelLimit * (run ? sprintMult : 1) + movingObjectVelocityInCharacterDir.z) - (currentVel.z - movingObjectVelocity2.z * Math.sin(angleBetweenCharacterDirAndObjectDir) + rejectVel.z * (isOnMovingObject ? 0 : rejectVelMult))) / accDeltaTime
    );
    const moveForceNeeded = moveAccNeeded.multiplyScalar(
      characterRef.current.mass()
    );
    characterRotated = Math.sin(characterModelIndicator.rotation.y).toFixed(3) == Math.sin(modelEuler.y).toFixed(3);
    if (!characterRotated) {
      moveImpulse.set(
        moveForceNeeded.x * turnVelMultiplier * (canJump ? 1 : airDragMultiplier),
        // if it's in the air, give it less control
        slopeAngle2 === null || slopeAngle2 == 0 ? 0 : movingDirection.y * turnVelMultiplier * (movingDirection.y > 0 ? slopeUpExtraForce : slopeDownExtraForce) * (run ? sprintMult : 1),
        moveForceNeeded.z * turnVelMultiplier * (canJump ? 1 : airDragMultiplier)
        // if it's in the air, give it less control
      );
    } else {
      moveImpulse.set(
        moveForceNeeded.x * (canJump ? 1 : airDragMultiplier),
        slopeAngle2 === null || slopeAngle2 == 0 ? 0 : movingDirection.y * (movingDirection.y > 0 ? slopeUpExtraForce : slopeDownExtraForce) * (run ? sprintMult : 1),
        moveForceNeeded.z * (canJump ? 1 : airDragMultiplier)
      );
    }
    characterRef.current.applyImpulseAtPoint(
      moveImpulse,
      {
        x: currentPos.x,
        y: currentPos.y + moveImpulsePointY,
        z: currentPos.z
      },
      true
    );
  };
  const autoBalanceCharacter = () => {
    bodyFacingVec.set(0, 0, 1).applyQuaternion(quat(characterRef.current.rotation()));
    bodyBalanceVec.set(0, 1, 0).applyQuaternion(quat(characterRef.current.rotation()));
    bodyBalanceVecOnX.set(0, bodyBalanceVec.y, bodyBalanceVec.z);
    bodyFacingVecOnY.set(bodyFacingVec.x, 0, bodyFacingVec.z);
    bodyBalanceVecOnZ.set(bodyBalanceVec.x, bodyBalanceVec.y, 0);
    if (isModeCameraBased) {
      modelEuler.y = pivot.rotation.y;
      pivot.getWorldDirection(modelFacingVec);
      slopeRayOriginUpdatePosition.set(movingDirection.x, 0, movingDirection.z);
      camBasedMoveCrossVecOnY.copy(slopeRayOriginUpdatePosition).cross(modelFacingVec);
      slopeRayOriginRef.current.position.x = slopeRayOriginOffest * Math.sin(slopeRayOriginUpdatePosition.angleTo(modelFacingVec) * (camBasedMoveCrossVecOnY.y < 0 ? 1 : -1));
      slopeRayOriginRef.current.position.z = slopeRayOriginOffest * Math.cos(slopeRayOriginUpdatePosition.angleTo(modelFacingVec) * (camBasedMoveCrossVecOnY.y < 0 ? 1 : -1));
    } else {
      characterModelIndicator.getWorldDirection(modelFacingVec);
    }
    crossVecOnX.copy(vectorY).cross(bodyBalanceVecOnX);
    crossVecOnY.copy(modelFacingVec).cross(bodyFacingVecOnY);
    crossVecOnZ.copy(vectorY).cross(bodyBalanceVecOnZ);
    dragAngForce.set(
      (crossVecOnX.x < 0 ? 1 : -1) * autoBalanceSpringK * bodyBalanceVecOnX.angleTo(vectorY) - characterRef.current.angvel().x * autoBalanceDampingC,
      (crossVecOnY.y < 0 ? 1 : -1) * autoBalanceSpringOnY * modelFacingVec.angleTo(bodyFacingVecOnY) - characterRef.current.angvel().y * autoBalanceDampingOnY,
      (crossVecOnZ.z < 0 ? 1 : -1) * autoBalanceSpringK * bodyBalanceVecOnZ.angleTo(vectorY) - characterRef.current.angvel().z * autoBalanceDampingC
    );
    characterRef.current.applyTorqueImpulse(dragAngForce, true);
  };
  const sleepCharacter = () => {
    if (characterRef.current) {
      if (document.visibilityState === "hidden") {
        characterRef.current.sleep();
      } else {
        setTimeout(() => {
          characterRef.current.wakeUp();
        }, wakeUpDelay);
      }
    }
  };
  const pointToMove = (delta, slopeAngle2, movingObjectVelocity2, functionKeyDown2) => {
    const moveToPoint = getMoveToPoint().moveToPoint;
    if (moveToPoint) {
      pointToPoint.set(moveToPoint.x - currentPos.x, 0, moveToPoint.z - currentPos.z);
      crossVector.crossVectors(pointToPoint, vectorZ);
      modelEuler.y = (crossVector.y > 0 ? -1 : 1) * pointToPoint.angleTo(vectorZ);
      if (isModeFixedCamera) pivot.rotation.y = THREE.MathUtils.lerp(pivot.rotation.y, modelEuler.y, fixedCamRotMult * delta * 3);
      if (characterRef.current) {
        if (pointToPoint.length() > 0.3 && !isBodyHitWall && !functionKeyDown2) {
          moveCharacter(delta, false, slopeAngle2, movingObjectVelocity2);
          isPointMoving = true;
        } else {
          setMoveToPoint(null);
          isPointMoving = false;
        }
      }
    }
  };
  useEffect(() => {
    if (followLight) {
      dirLight = characterModelRef.current.parent.parent.children.find(
        (item) => {
          return item.name === "followLight";
        }
      );
    }
  });
  if (isInsideKeyboardControls) {
    useEffect(() => {
      const unSubscribeAction1 = subscribeKeys(
        (state) => state.action1,
        (value) => {
          if (value) {
            animated && action1Animation();
          }
        }
      );
      const unSubscribeAction2 = subscribeKeys(
        (state) => state.action2,
        (value) => {
          if (value) {
            animated && action2Animation();
          }
        }
      );
      const unSubscribeAction3 = subscribeKeys(
        (state) => state.action3,
        (value) => {
          if (value) {
            animated && action3Animation();
          }
        }
      );
      const unSubscribeAction4 = subscribeKeys(
        (state) => state.action4,
        (value) => {
          if (value) {
            animated && action4Animation();
          }
        }
      );
      return () => {
        unSubscribeAction1();
        unSubscribeAction2();
        unSubscribeAction3();
        unSubscribeAction4();
      };
    });
  }
  useEffect(() => {
    const unSubPressButton2 = useJoystickControls.subscribe(
      (state) => state.curButton2Pressed,
      (value) => {
        if (value) {
          animated && action4Animation();
        }
      }
    );
    const unSubPressButton3 = useJoystickControls.subscribe(
      (state) => state.curButton3Pressed,
      (value) => {
        if (value) {
          animated && action2Animation();
        }
      }
    );
    const unSubPressButton4 = useJoystickControls.subscribe(
      (state) => state.curButton4Pressed,
      (value) => {
        if (value) {
          animated && action3Animation();
        }
      }
    );
    const unSubPressButton5 = useJoystickControls.subscribe(
      (state) => state.curButton5Pressed,
      (value) => {
        if (value) {
          animated && action1Animation();
        }
      }
    );
    return () => {
      unSubPressButton2();
      unSubPressButton3();
      unSubPressButton4();
      unSubPressButton5();
    };
  });
  useEffect(() => {
    characterRef.current.setEnabledRotations(
      autoBalance ? true : false,
      autoBalance ? true : false,
      autoBalance ? true : false,
      false
    );
    return () => {
      if (characterRef.current && characterModelRef.current) {
        characterModelRef.current.quaternion.set(0, 0, 0, 1);
        characterRef.current.setRotation({ x: 0, y: 0, z: 0, w: 1 }, false);
      }
    };
  }, [autoBalance]);
  useEffect(() => {
    modelEuler.y = characterInitDir;
    window.addEventListener("visibilitychange", sleepCharacter);
    window.addEventListener("gamepadconnected", gamepadConnect);
    window.addEventListener("gamepaddisconnected", gamepadDisconnect);
    return () => {
      window.removeEventListener("visibilitychange", sleepCharacter);
      window.removeEventListener("gamepadconnected", gamepadConnect);
      window.removeEventListener("gamepaddisconnected", gamepadDisconnect);
    };
  }, []);
  useFrame((state, delta) => {
    var _a, _b, _c;
    if (delta > 1) delta %= 1;
    if (characterRef.current) {
      currentPos.copy(characterRef.current.translation());
      currentVel.copy(characterRef.current.linvel());
      characterRef.current.userData.canJump = canJump;
      characterRef.current.userData.slopeAngle = slopeAngle;
      characterRef.current.userData.characterRotated = characterRotated;
      characterRef.current.userData.isOnMovingObject = isOnMovingObject;
    }
    if (followLight && dirLight) {
      dirLight.position.x = currentPos.x + followLightPos.x;
      dirLight.position.y = currentPos.y + followLightPos.y;
      dirLight.position.z = currentPos.z + followLightPos.z;
      dirLight.target = characterModelRef.current;
    }
    pivotPosition.set(
      currentPos.x + camTargetPos.x,
      currentPos.y + (camTargetPos.y || capsuleHalfHeight + capsuleRadius / 2),
      currentPos.z + camTargetPos.z
    );
    pivot.position.lerp(pivotPosition, 1 - Math.exp(-camFollowMult * delta));
    if (!disableFollowCam) {
      followCam.getWorldPosition(followCamPosition);
      state.camera.position.lerp(followCamPosition, 1 - Math.exp(-camLerpMult * delta));
      state.camera.lookAt(pivot.position);
    }
    camCollision && cameraCollisionDetect(delta);
    if (disableControl) return;
    if (controllerIndex !== null) {
      const gamepad = navigator.getGamepads()[controllerIndex];
      handleButtons(gamepad.buttons);
      handleSticks(gamepad.axes);
      modelEuler.y = ((movingDirection2) => movingDirection2 === null ? modelEuler.y : movingDirection2)(getMovingDirection(gamepadKeys.forward, gamepadKeys.backward, gamepadKeys.leftward, gamepadKeys.rightward, pivot));
    }
    const {
      joystickDis,
      joystickAng,
      runState,
      button1Pressed
    } = getJoystickValues();
    if (joystickDis > 0) {
      modelEuler.y = pivot.rotation.y + (joystickAng - Math.PI / 2);
      moveCharacter(delta, runState, slopeAngle, movingObjectVelocity);
    }
    const { forward, backward, leftward, rightward, jump, run } = isInsideKeyboardControls ? getKeys() : presetKeys;
    modelEuler.y = ((movingDirection2) => movingDirection2 === null ? modelEuler.y : movingDirection2)(getMovingDirection(forward, backward, leftward, rightward, pivot));
    if (forward || backward || leftward || rightward || gamepadKeys.forward || gamepadKeys.backward || gamepadKeys.leftward || gamepadKeys.rightward)
      moveCharacter(delta, run, slopeAngle, movingObjectVelocity);
    if ((jump || button1Pressed) && canJump) {
      jumpVelocityVec.set(
        currentVel.x,
        run ? sprintJumpMult * jumpVel : jumpVel,
        currentVel.z
      );
      characterRef.current.setLinvel(
        jumpDirection.set(0, (run ? sprintJumpMult * jumpVel : jumpVel) * slopJumpMult, 0).projectOnVector(actualSlopeNormalVec).add(jumpVelocityVec),
        true
      );
      characterMassForce.y *= jumpForceToGroundMult;
      (_a = rayHit.collider.parent()) == null ? void 0 : _a.applyImpulseAtPoint(characterMassForce, standingForcePoint, true);
    }
    modelQuat.setFromEuler(modelEuler);
    characterModelIndicator.quaternion.rotateTowards(
      modelQuat,
      delta * turnSpeed
    );
    if (!autoBalance) {
      if (isModeCameraBased) {
        characterModelRef.current.quaternion.copy(pivot.quaternion);
      } else {
        characterModelRef.current.quaternion.copy(characterModelIndicator.quaternion);
      }
    }
    rayOrigin.addVectors(currentPos, rayOriginOffest);
    rayHit = world.castRay(
      rayCast,
      rayLength,
      true,
      // this exclude sensor 
      16,
      null,
      null,
      characterRef.current,
      // this exclude any collider with userData: excludeEcctrlRay
      (collider) => collider.parent().userData && !collider.parent().userData.excludeEcctrlRay
    );
    if (rayHit && rayHit.timeOfImpact < floatingDis + rayHitForgiveness) {
      if (slopeRayHit && actualSlopeAngle < slopeMaxAngle) {
        canJump = true;
      }
    } else {
      canJump = false;
    }
    if (rayHit && canJump) {
      if (rayHit.collider.parent()) {
        standingForcePoint.set(
          rayOrigin.x,
          rayOrigin.y - rayHit.timeOfImpact,
          rayOrigin.z
        );
        const rayHitObjectBodyType = rayHit.collider.parent().bodyType();
        const rayHitObjectBodyMass = rayHit.collider.parent().mass();
        massRatio = characterRef.current.mass() / rayHitObjectBodyMass;
        if (rayHitObjectBodyType === 0 || rayHitObjectBodyType === 2) {
          isOnMovingObject = true;
          distanceFromCharacterToObject.copy(currentPos).sub(rayHit.collider.parent().translation());
          const movingObjectLinvel = rayHit.collider.parent().linvel();
          const movingObjectAngvel = rayHit.collider.parent().angvel();
          movingObjectVelocity.set(
            movingObjectLinvel.x + objectAngvelToLinvel.crossVectors(
              movingObjectAngvel,
              distanceFromCharacterToObject
            ).x,
            movingObjectLinvel.y,
            movingObjectLinvel.z + objectAngvelToLinvel.crossVectors(
              movingObjectAngvel,
              distanceFromCharacterToObject
            ).z
          ).multiplyScalar(Math.min(1, 1 / massRatio));
          velocityDiff.subVectors(movingObjectVelocity, currentVel);
          if (velocityDiff.length() > 30) movingObjectVelocity.multiplyScalar(1 / velocityDiff.length());
          if (rayHitObjectBodyType === 0) {
            if (!forward && !backward && !leftward && !rightward && canJump && joystickDis === 0 && !isPointMoving && !gamepadKeys.forward && !gamepadKeys.backward && !gamepadKeys.leftward && !gamepadKeys.rightward) {
              movingObjectDragForce.copy(bodyContactForce).multiplyScalar(delta).multiplyScalar(Math.min(1, 1 / massRatio)).negate();
              bodyContactForce.set(0, 0, 0);
            } else {
              movingObjectDragForce.copy(moveImpulse).multiplyScalar(Math.min(1, 1 / massRatio)).negate();
            }
            rayHit.collider.parent().applyImpulseAtPoint(
              movingObjectDragForce,
              standingForcePoint,
              true
            );
          }
        } else {
          massRatio = 1;
          isOnMovingObject = false;
          bodyContactForce.set(0, 0, 0);
          movingObjectVelocity.set(0, 0, 0);
        }
      }
    } else {
      massRatio = 1;
      isOnMovingObject = false;
      bodyContactForce.set(0, 0, 0);
      movingObjectVelocity.set(0, 0, 0);
    }
    slopeRayOriginRef.current.getWorldPosition(slopeRayorigin);
    slopeRayorigin.y = rayOrigin.y;
    slopeRayHit = world.castRay(
      slopeRayCast,
      slopeRayLength,
      true,
      // this exclude sensor 
      16,
      null,
      null,
      characterRef.current,
      // this exclude any collider with userData: excludeEcctrlRay
      (collider) => collider.parent().userData && !collider.parent().userData.excludeEcctrlRay
    );
    if (slopeRayHit) {
      actualSlopeNormal = (_b = slopeRayHit.collider.castRayAndGetNormal(
        slopeRayCast,
        slopeRayLength,
        false
      )) == null ? void 0 : _b.normal;
      if (actualSlopeNormal) {
        actualSlopeNormalVec == null ? void 0 : actualSlopeNormalVec.set(
          actualSlopeNormal.x,
          actualSlopeNormal.y,
          actualSlopeNormal.z
        );
        actualSlopeAngle = actualSlopeNormalVec == null ? void 0 : actualSlopeNormalVec.angleTo(floorNormal);
      }
    }
    if (slopeRayHit && rayHit && slopeRayHit.timeOfImpact < floatingDis + 0.5) {
      if (canJump) {
        slopeAngle = Number(
          Math.atan(
            (rayHit.timeOfImpact - slopeRayHit.timeOfImpact) / slopeRayOriginOffest
          ).toFixed(2)
        );
      } else {
        slopeAngle = null;
      }
    } else {
      slopeAngle = null;
    }
    if (rayHit != null) {
      if (canJump && rayHit.collider.parent()) {
        floatingForce = springK * (floatingDis - rayHit.timeOfImpact) - characterRef.current.linvel().y * dampingC;
        characterRef.current.applyImpulse(
          springDirVec.set(0, floatingForce, 0),
          false
        );
        characterMassForce.set(0, floatingForce > 0 ? -floatingForce : 0, 0);
        (_c = rayHit.collider.parent()) == null ? void 0 : _c.applyImpulseAtPoint(characterMassForce, standingForcePoint, true);
      }
    }
    if (!forward && !backward && !leftward && !rightward && canJump && joystickDis === 0 && !isPointMoving && !gamepadKeys.forward && !gamepadKeys.backward && !gamepadKeys.leftward && !gamepadKeys.rightward) {
      if (!isOnMovingObject) {
        dragForce.set(
          -currentVel.x * dragDampingC,
          0,
          -currentVel.z * dragDampingC
        );
        characterRef.current.applyImpulse(dragForce, false);
      } else {
        dragForce.set(
          (movingObjectVelocity.x - currentVel.x) * dragDampingC,
          0,
          (movingObjectVelocity.z - currentVel.z) * dragDampingC
        );
        characterRef.current.applyImpulse(dragForce, true);
      }
    }
    isFalling = currentVel.y < 0 && !canJump ? true : false;
    if (characterRef.current) {
      if (currentVel.y < fallingMaxVel) {
        if (characterRef.current.gravityScale() !== 0) {
          characterRef.current.setGravityScale(0, true);
        }
      } else {
        if (!isFalling && characterRef.current.gravityScale() !== initialGravityScale) {
          characterRef.current.setGravityScale(initialGravityScale, true);
        } else if (isFalling && characterRef.current.gravityScale() !== fallingGravityScale) {
          characterRef.current.setGravityScale(fallingGravityScale, true);
        }
      }
    }
    if (autoBalance && characterRef.current) autoBalanceCharacter();
    if (isModePointToMove) {
      functionKeyDown = forward || backward || leftward || rightward || joystickDis > 0 || gamepadKeys.forward || gamepadKeys.backward || gamepadKeys.leftward || gamepadKeys.rightward || jump || button1Pressed;
      pointToMove(delta, slopeAngle, movingObjectVelocity, functionKeyDown);
    }
    if (isModeFixedCamera) {
      if (leftward || gamepadKeys.leftward || joystickDis > 0 && joystickAng > 2 * Math.PI / 3 && joystickAng < 4 * Math.PI / 3 || gamepadJoystickDis > 0 && gamepadJoystickAng > 2 * Math.PI / 3 && gamepadJoystickAng < 4 * Math.PI / 3) {
        pivot.rotation.y += run ? delta * sprintMult * fixedCamRotMult : delta * fixedCamRotMult;
      } else if (rightward || gamepadKeys.rightward || (joystickDis > 0 && joystickAng < Math.PI / 3 || joystickAng > 5 * Math.PI / 3) || (gamepadJoystickDis > 0 && gamepadJoystickAng < Math.PI / 3 || gamepadJoystickAng > 5 * Math.PI / 3)) {
        pivot.rotation.y -= run ? delta * sprintMult * fixedCamRotMult : delta * fixedCamRotMult;
      }
    }
    if (animated) {
      if (!forward && !backward && !leftward && !rightward && !jump && !button1Pressed && joystickDis === 0 && !isPointMoving && !gamepadKeys.forward && !gamepadKeys.backward && !gamepadKeys.leftward && !gamepadKeys.rightward && canJump) {
        idleAnimation();
      } else if ((jump || button1Pressed) && canJump) {
        jumpAnimation();
      } else if (canJump && (forward || backward || leftward || rightward || joystickDis > 0 || isPointMoving || gamepadKeys.forward || gamepadKeys.backward || gamepadKeys.leftward || gamepadKeys.rightward)) {
        run || runState ? runAnimation() : walkAnimation();
      } else if (!canJump) {
        jumpIdleAnimation();
      }
      if (rayHit == null && isFalling) {
        fallAnimation();
      }
    }
  });
  return /* @__PURE__ */ jsxs(
    RigidBody,
    {
      colliders: false,
      ref: characterRef,
      position: props.position || [0, 5, 0],
      friction: props.friction || -0.5,
      onContactForce: (e) => bodyContactForce.set(e.totalForce.x, e.totalForce.y, e.totalForce.z),
      onCollisionExit: () => bodyContactForce.set(0, 0, 0),
      userData: { canJump: false },
      ...props,
      children: [
        /* @__PURE__ */ jsx(
          CapsuleCollider,
          {
            name: "character-capsule-collider",
            args: [capsuleHalfHeight, capsuleRadius]
          }
        ),
        isModePointToMove && /* @__PURE__ */ jsx(
          CylinderCollider,
          {
            ref: bodySensorRef,
            sensor: true,
            args: [capsuleHalfHeight / 2, capsuleRadius],
            position: [0, 0, capsuleRadius / 2],
            onIntersectionEnter: handleOnIntersectionEnter,
            onIntersectionExit: handleOnIntersectionExit
          }
        ),
        /* @__PURE__ */ jsxs("group", { ref: characterModelRef, userData: { camExcludeCollision: true }, children: [
          /* @__PURE__ */ jsx(
            "mesh",
            {
              position: [
                rayOriginOffest.x,
                rayOriginOffest.y,
                rayOriginOffest.z + slopeRayOriginOffest
              ],
              ref: slopeRayOriginRef,
              visible: showSlopeRayOrigin,
              userData: { camExcludeCollision: true },
              children: /* @__PURE__ */ jsx("boxGeometry", { args: [0.15, 0.15, 0.15] })
            }
          ),
          children
        ] })
      ]
    }
  );
};
const Ecctrl$1 = forwardRef(Ecctrl);
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
  return /* @__PURE__ */ jsx("primitive", { object: scene });
};
const Map = () => {
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
    "/Spawn_Int.glb"
  ];
  const scenes = sceneFilenames.map((filename) => {
    const { scene } = useGLTF(filename);
    scene.position.set(35, -20, 0);
    return scene;
  });
  return /* @__PURE__ */ jsx(RigidBody, { type: "fixed", colliders: "trimesh", ccd: true, children: scenes.map((scene, index) => /* @__PURE__ */ jsx("primitive", { object: scene }, index)) });
};
const Home = () => {
  var _a;
  const location = useLocation();
  const avatarUrl = (_a = location.state) == null ? void 0 : _a.avatarUrl;
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const keyboardMap = [
    { name: "forward", keys: ["ArrowUp", "KeyW"] },
    { name: "backward", keys: ["ArrowDown", "KeyS"] },
    { name: "leftward", keys: ["ArrowLeft", "KeyA"] },
    { name: "rightward", keys: ["ArrowRight", "KeyD"] },
    { name: "jump", keys: ["Space"] },
    { name: "run", keys: ["Shift"] },
    { name: "action1", keys: ["f"] }
  ];
  const animations = [
    "F_Dances_001",
    "F_Dances_004",
    "F_Dances_007",
    "F_Dances_006",
    "M_Dances_006",
    "M_Dances_001",
    "M_Dances_011",
    "M_Dances_004"
  ];
  const animationSet = {
    idle: "F_Standing_Idle_001",
    walk: "F_Walk_003",
    run: "F_Run_001",
    jump: "F_Standing_Idle_001",
    jumpIdle: "F_Standing_Idle_001",
    jumpLand: "F_Standing_Idle_001",
    fall: "F_Falling_Idle_000",
    action1: animations[Math.floor(Math.random() * animations.length)]
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
  return /* @__PURE__ */ jsxs(
    Suspense,
    {
      fallback: /* @__PURE__ */ jsx(
        Box,
        {
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          bgcolor: "background.default",
          color: "text.primary",
          children: /* @__PURE__ */ jsxs(Box, { textAlign: "center", children: [
            /* @__PURE__ */ jsx(CircularProgress, {}),
            /* @__PURE__ */ jsx(Typography, { variant: "h6", mt: 2, children: "Loading, please wait..." })
          ] })
        }
      ),
      children: [
        /* @__PURE__ */ jsxs(Canvas, { style: { width: "100vw", height: "100vh" }, shadows: true, children: [
          /* @__PURE__ */ jsx(
            "directionalLight",
            {
              intensity: 0.7,
              color: "#FFFFED",
              castShadow: true,
              "shadow-bias": -4e-4,
              position: [-20, 20, 20],
              "shadow-camera-top": 20,
              "shadow-camera-right": 20,
              "shadow-camera-bottom": -20,
              "shadow-camera-left": -20
            }
          ),
          /* @__PURE__ */ jsx("ambientLight", { intensity: 0.5 }),
          /* @__PURE__ */ jsx(Physics, { timeStep: "vary", children: /* @__PURE__ */ jsxs(Suspense, { fallback: null, children: [
            /* @__PURE__ */ jsx(Environment, { files: "/HDRI.jpg" }),
            /* @__PURE__ */ jsx(KeyboardControls, { map: keyboardMap, children: /* @__PURE__ */ jsx(Ecctrl$1, { animated: true, children: /* @__PURE__ */ jsx(
              EcctrlAnimation,
              {
                characterURL: avatarUrl,
                animationSet,
                children: /* @__PURE__ */ jsx(Model, { avatarUrl })
              }
            ) }) }),
            /* @__PURE__ */ jsx(Map, {})
          ] }) })
        ] }),
        /* @__PURE__ */ jsx(
          Box,
          {
            onClick: () => setIsHovered((prev) => !prev),
            style: {
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
              cursor: "pointer"
            },
            children: isHovered ? /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Box, { style: { marginBottom: "9px" }, children: "Movement : WASD" }),
              /* @__PURE__ */ jsx(Box, { style: { marginBottom: "9px" }, children: "Jump : Space" }),
              /* @__PURE__ */ jsx(Box, { style: { marginBottom: "9px" }, children: "Sprint : Shift" }),
              /* @__PURE__ */ jsx(Box, { style: { marginBottom: "9px" }, children: "Dance : F" })
            ] }) : "🎮"
          }
        ),
        /* @__PURE__ */ jsx(
          IconButton,
          {
            style: {
              position: "fixed",
              bottom: "2%",
              left: "2%",
              fontSize: "2.3rem"
            },
            onClick: handleAudioToggle,
            children: isPlaying ? "🔊" : "🔇"
          }
        ),
        /* @__PURE__ */ jsx(BackgroundMusic, { src: "/audio/bg.mp3", isPlaying })
      ]
    }
  );
};
const route2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Home
}, Symbol.toStringTag, { value: "Module" }));
const serverManifest = { "entry": { "module": "/assets/entry.client-C5unboBk.js", "imports": ["/assets/index-C-IPMWa8.js", "/assets/index-BBk-zhoh.js", "/assets/components-BTvdKZx5.js"], "css": [] }, "routes": { "root": { "id": "root", "parentId": void 0, "path": "", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/root-BLysSHZ2.js", "imports": ["/assets/index-C-IPMWa8.js", "/assets/index-BBk-zhoh.js", "/assets/components-BTvdKZx5.js"], "css": ["/assets/root-CXLa4HBJ.css"] }, "routes/_index": { "id": "routes/_index", "parentId": "root", "path": void 0, "index": true, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/_index-BnC7yXMQ.js", "imports": ["/assets/index-C-IPMWa8.js"], "css": [] }, "routes/home": { "id": "routes/home", "parentId": "root", "path": "home", "index": void 0, "caseSensitive": void 0, "hasAction": false, "hasLoader": false, "hasClientAction": false, "hasClientLoader": false, "hasErrorBoundary": false, "module": "/assets/home-DRWaygys.js", "imports": ["/assets/index-C-IPMWa8.js", "/assets/index-BBk-zhoh.js"], "css": [] } }, "url": "/assets/manifest-719ed719.js", "version": "719ed719" };
const mode = "production";
const assetsBuildDirectory = "build\\client";
const basename = "/";
const future = { "v3_fetcherPersist": true, "v3_relativeSplatPath": true, "v3_throwAbortReason": true, "unstable_singleFetch": false, "unstable_lazyRouteDiscovery": false, "unstable_optimizeDeps": false };
const isSpaMode = false;
const publicPath = "/";
const entry = { module: entryServer };
const routes = {
  "root": {
    id: "root",
    parentId: void 0,
    path: "",
    index: void 0,
    caseSensitive: void 0,
    module: route0
  },
  "routes/_index": {
    id: "routes/_index",
    parentId: "root",
    path: void 0,
    index: true,
    caseSensitive: void 0,
    module: route1
  },
  "routes/home": {
    id: "routes/home",
    parentId: "root",
    path: "home",
    index: void 0,
    caseSensitive: void 0,
    module: route2
  }
};
export {
  serverManifest as assets,
  assetsBuildDirectory,
  basename,
  entry,
  future,
  isSpaMode,
  mode,
  publicPath,
  routes
};

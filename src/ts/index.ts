import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { FreeCamera } from "@babylonjs/core/Cameras/freeCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Effect } from "@babylonjs/core/Materials/effect";
import { PostProcess } from "@babylonjs/core/PostProcesses/postProcess";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import { PointLight } from "@babylonjs/core/Lights/pointLight";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";

import "../styles/index.scss";

import postprocessCode from "../shaders/smallPostProcess.glsl";
import { ArcRotateCamera, Constants, HemisphericLight, WebGPUEngine } from "@babylonjs/core";
import { BaseSpectrum } from "./baseSpectrum";
import { createStorageTexture, createTexturedPlane } from "./utils";
import { IFFT } from "./IFFT";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new WebGPUEngine(canvas);
await engine.initAsync();

const scene = new Scene(engine);

const camera = new ArcRotateCamera("camera", 3.14 / 3, 3.14 / 3, 5, Vector3.Zero(), scene);
camera.wheelPrecision = 100;
camera.attachControl();

const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

const textureSize = 256;

const baseSpectrum = new BaseSpectrum(textureSize, engine);
baseSpectrum.generate();

createTexturedPlane(baseSpectrum.noise, scene);

const h0k = createTexturedPlane(baseSpectrum.h0k, scene);
h0k.position.x += 1;

const ifft = new IFFT(engine, textureSize);

const buffer = createStorageTexture("buffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);

ifft.applyToTexture(baseSpectrum.h0k, buffer);
const twiddle = createTexturedPlane(buffer, scene);
twiddle.position.x -= 1;

//Effect.ShadersStore[`PostProcess1FragmentShader`] = postprocessCode;
//const postProcess = new PostProcess("postProcess1", "PostProcess1", [], ["textureSampler"], 1, camera, Texture.BILINEAR_SAMPLINGMODE, engine);

let clock = 0;

function updateScene() {
    const deltaTime = engine.getDeltaTime() / 1000;
    clock += deltaTime;
}

scene.executeWhenReady(() => {
    engine.loadingScreen.hideLoadingUI();
    scene.registerBeforeRender(() => updateScene());
    engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize(true);
});


import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";

import "../styles/index.scss";

import { ArcRotateCamera, Constants, DirectionalLight, WebGPUEngine } from "@babylonjs/core";
import { BaseSpectrum } from "./baseSpectrum";
import { createStorageTexture } from "./utils";
import { IFFT } from "./IFFT";
import { DynamicSpectrum } from "./dynamicSpectrum";
import { WaterMaterial } from "./waterMaterial";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new WebGPUEngine(canvas);
await engine.initAsync();

const scene = new Scene(engine);

const camera = new ArcRotateCamera("camera", 3.14 / 3, 3.14 / 3, 5, Vector3.Zero(), scene);
camera.attachControl();

const light = new DirectionalLight("light", new Vector3(1, -1, 0).normalize(), scene);

const textureSize = 512;
const tileScale = 1000;

const baseSpectrum = new BaseSpectrum(textureSize, tileScale, engine);
const dynamicSpectrum = new DynamicSpectrum(baseSpectrum, engine);

const ifft = new IFFT(engine, textureSize);
const heightBuffer = createStorageTexture("heightBuffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);
const gradientBuffer = createStorageTexture("gradientBuffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);
const displacementBuffer = createStorageTexture("displacementBuffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);

const waterMaterial = new WaterMaterial("waterMaterial", scene);
waterMaterial.setTexture("heightMap", heightBuffer);
waterMaterial.setTexture("gradientMap", gradientBuffer);
waterMaterial.setTexture("displacementMap", displacementBuffer);

const water = MeshBuilder.CreateGround("water", {
    width: 10,
    height: 10,
    subdivisions: textureSize
}, scene);
water.material = waterMaterial;
water.position.y = -1;


// starting at 0 can create visual artefacts
let clock = 60 * 60;

function updateScene() {
    const deltaTime = engine.getDeltaTime() / 1000;
    clock += deltaTime;

    dynamicSpectrum.generate(clock);

    ifft.applyToTexture(dynamicSpectrum.ht, heightBuffer);
    ifft.applyToTexture(dynamicSpectrum.dht, gradientBuffer);
    ifft.applyToTexture(dynamicSpectrum.displacement, displacementBuffer);

    waterMaterial.setFloat("tileScale", tileScale);
    waterMaterial.setVector3("cameraPositionW", camera.globalPosition);
    waterMaterial.setVector3("lightDirection", light.direction);
}

scene.executeWhenReady(() => {
    scene.registerBeforeRender(() => updateScene());
    engine.runRenderLoop(() => scene.render());
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    engine.resize(true);
});


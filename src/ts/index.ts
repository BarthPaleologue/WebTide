import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";

import "../styles/index.scss";

import postprocessCode from "../shaders/smallPostProcess.glsl";
import { ArcRotateCamera, Constants, HemisphericLight, Mesh, StandardMaterial, WebGPUEngine } from "@babylonjs/core";
import { BaseSpectrum } from "./baseSpectrum";
import { createStorageTexture, createTexturedPlane } from "./utils";
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
camera.wheelPrecision = 100;
camera.attachControl();

const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

const textureSize = 256;

const baseSpectrum = new BaseSpectrum(textureSize, engine);
baseSpectrum.generate();

createTexturedPlane(baseSpectrum.noise, scene);

const h0k = createTexturedPlane(baseSpectrum.h0, scene);
h0k.position.x += 1;

const dynamicSpectrum = new DynamicSpectrum(baseSpectrum, engine);

const ht = createTexturedPlane(dynamicSpectrum.ht, scene);
ht.position.z -= 1;

const ifft = new IFFT(engine, textureSize);
const buffer = createStorageTexture("buffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);

const twiddle = createTexturedPlane(buffer, scene);
twiddle.position.x -= 1;


const waterMaterial = new WaterMaterial("waterMaterial", scene);

const radius = 1;
const tileSize = 20;
for(let x = -radius; x <= radius; x++) {
    for(let z = -radius; z <= radius; z++) {
        const water = MeshBuilder.CreateGround("water", { width: tileSize, height: tileSize, subdivisions: textureSize }, scene);
        water.material = waterMaterial;
        water.position.x = x * tileSize;
        water.position.z = z * tileSize;
        water.position.y = -1;
    }
}

let clock = 0;

function updateScene() {
    const deltaTime = engine.getDeltaTime() / 1000;
    clock += deltaTime;

    dynamicSpectrum.generate(clock);

    ifft.applyToTexture(dynamicSpectrum.ht, buffer);


    waterMaterial.setTexture("heightMap", buffer);
    waterMaterial.setVector3("cameraPositionW", camera.globalPosition);
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


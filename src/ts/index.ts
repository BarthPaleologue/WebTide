import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";

import "../styles/index.scss";

import { ArcRotateCamera, Constants, DirectionalLight, WebGPUEngine } from "@babylonjs/core";
import { BaseSpectrum } from "./baseSpectrum";
import { createStorageTexture, createTexturedPlane } from "./utils";
import { IFFT } from "./IFFT";
import { DynamicSpectrum } from "./dynamicSpectrum";
import { WaterMaterial } from "./waterMaterial";
import { SkyMaterial } from "@babylonjs/materials";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new WebGPUEngine(canvas);
await engine.initAsync();

const scene = new Scene(engine);

const camera = new ArcRotateCamera("camera", 3.14 / 3, 3.14 / 3, 5, Vector3.Zero(), scene);
camera.wheelPrecision = 100;
camera.attachControl();

const light = new DirectionalLight("light", new Vector3(3, -1, 0).normalize(), scene);

const sky = new SkyMaterial("sky", scene);
sky.backFaceCulling = false;
sky.sunPosition = light.direction.negate();
sky.useSunPosition = true;

const skyBox = MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
skyBox.material = sky;

const textureSize = 512;
const lengthScale = 1000;

const baseSpectrum = new BaseSpectrum(textureSize, lengthScale, engine);
baseSpectrum.generate();

createTexturedPlane(baseSpectrum.noise, scene);

const h0k = createTexturedPlane(baseSpectrum.h0, scene);
h0k.position.x += 1;

const dynamicSpectrum = new DynamicSpectrum(baseSpectrum, engine);

const ht = createTexturedPlane(dynamicSpectrum.ht, scene);
ht.position.z -= 1;

const ifft = new IFFT(engine, textureSize);
const heightBuffer = createStorageTexture("buffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);
const gradientBuffer = createStorageTexture("gradientBuffer", engine, textureSize, textureSize, Constants.TEXTUREFORMAT_RG);

const twiddle = createTexturedPlane(heightBuffer, scene);
twiddle.position.x -= 1;


const waterMaterial = new WaterMaterial("waterMaterial", scene);

const radius = 1;
const tileSize = 10;
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

    ifft.applyToTexture(dynamicSpectrum.ht, heightBuffer);
    ifft.applyToTexture(dynamicSpectrum.dht, gradientBuffer);

    waterMaterial.setTexture("heightMap", heightBuffer);
    waterMaterial.setTexture("gradientMap", gradientBuffer);
    waterMaterial.setFloat("lengthScale", lengthScale);
    waterMaterial.setVector3("cameraPositionW", camera.globalPosition);
    waterMaterial.setVector3("lightDirection", light.direction);
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


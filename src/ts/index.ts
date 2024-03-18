import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";

import "../styles/index.scss";

import { ArcRotateCamera, DirectionalLight, WebGPUEngine } from "@babylonjs/core";
import { createTexturedPlane } from "./utils";
import { WaterMaterial } from "./waterMaterial";
import { SkyMaterial } from "@babylonjs/materials";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new WebGPUEngine(canvas);
engine.loadingScreen.displayLoadingUI();
await engine.initAsync();

const scene = new Scene(engine);

const camera = new ArcRotateCamera("camera", 3.14 / 3, 3.14 / 3, 5, Vector3.Zero(), scene);
camera.wheelPrecision = 100;
camera.attachControl();

const light = new DirectionalLight("light", new Vector3(1, -1, 0).normalize(), scene);

const sky = new SkyMaterial("sky", scene);
sky.backFaceCulling = false;
sky.sunPosition = light.direction.negate();
sky.useSunPosition = true;

const skyBox = MeshBuilder.CreateBox("skyBox", { size: 1000 }, scene);
skyBox.material = sky;

const textureSize = 512;
const tileScale = 1000;

const waterMaterial = new WaterMaterial("waterMaterial", textureSize, tileScale, scene, engine);

createTexturedPlane(waterMaterial.baseSpectrum.noise, scene);

const h0k = createTexturedPlane(waterMaterial.baseSpectrum.h0, scene);
h0k.position.x += 1;

const ht = createTexturedPlane(waterMaterial.dynamicSpectrum.ht, scene);
ht.position.z -= 1;

const twiddle = createTexturedPlane(waterMaterial.heightBuffer, scene);
twiddle.position.x -= 1;

const radius = 2;
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

function updateScene() {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    waterMaterial.update(deltaSeconds, light.direction);
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


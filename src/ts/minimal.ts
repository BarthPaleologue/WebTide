import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import "@babylonjs/core/Materials/standardMaterial";
import "@babylonjs/core/Loading/loadingScreen";

import "../styles/index.scss";

import { ArcRotateCamera, DirectionalLight, WebGPUEngine } from "@babylonjs/core";
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

const waterMaterial = new WaterMaterial("waterMaterial", textureSize, tileScale, scene, engine);

const water = MeshBuilder.CreateGround("water", {
    width: 10,
    height: 10,
    subdivisions: textureSize
}, scene);
water.material = waterMaterial;
water.position.y = -1;

function updateScene() {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    waterMaterial.update(deltaSeconds, light.direction);
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


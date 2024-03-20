import "../styles/index.scss";

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { WebGPUEngine } from "@babylonjs/core/Engines";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

import { WaterMaterial } from "./waterMaterial";
import { PhillipsSpectrum } from "./spectrum/phillipsSpectrum";

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
const tileSize = 1000;
const scaling = 0.01;

const initialSpectrum = new PhillipsSpectrum(textureSize, tileSize, engine);
const waterMaterial = new WaterMaterial("waterMaterial", initialSpectrum, scene);

const water = MeshBuilder.CreateGround(
    "water",
    {
        width: tileSize * scaling,
        height: tileSize * scaling,
        subdivisions: textureSize
    },
    scene
);
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

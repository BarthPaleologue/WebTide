import "../styles/index.scss";

import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { WebGPUEngine } from "@babylonjs/core/Engines";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

import { WaterMaterial } from "./waterMaterial";
import { PhillipsSpectrum } from "./spectrum/phillipsSpectrum";
import { Planet } from "./planet/planet";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new WebGPUEngine(canvas);
await engine.initAsync();

const scene = new Scene(engine);

const camera = new ArcRotateCamera("camera", 3.14 / 3, 3.14 / 3, 15, Vector3.Zero(), scene);
camera.attachControl();

const light = new DirectionalLight("light", new Vector3(1, -1, 0).normalize(), scene);

const textureSize = 512;
const tileScale = 1000;

const initialSpectrum = new PhillipsSpectrum(textureSize, tileScale, engine);
const waterMaterial = new WaterMaterial("waterMaterial", initialSpectrum, scene);

const planet = new Planet(3, scene);
planet.transform.position.y = 4;
//planet.material.wireframe = true;

camera.setTarget(planet.transform.position);

const water = MeshBuilder.CreateGround(
    "water",
    {
        width: 10,
        height: 10,
        subdivisions: textureSize
    },
    scene
);
water.material = waterMaterial;
water.position.y = -1;

function updateScene() {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    waterMaterial.update(deltaSeconds, light.direction);
    planet.material.update(deltaSeconds, planet.transform, light.direction);
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

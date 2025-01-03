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
import { OceanPlanetMaterial } from "./planet/oceanPlanetMaterial";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

const canvas = document.getElementById("renderer") as HTMLCanvasElement;
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const engine = new WebGPUEngine(canvas);
await engine.initAsync();

const scene = new Scene(engine);

const textureSize = 512;
const tileSize = 10;

const camera = new ArcRotateCamera("camera", 3.14 / 3, 3.14 / 3, tileSize * 1.5, Vector3.Zero(), scene);
camera.lowerRadiusLimit = tileSize;
camera.attachControl();

const light = new DirectionalLight("light", new Vector3(1, -1, 3).normalize(), scene);

const initialSpectrum = new PhillipsSpectrum(textureSize, tileSize, engine);
const waterMaterial = new WaterMaterial("waterMaterial", initialSpectrum, scene, engine);

const water = MeshBuilder.CreateGround(
    "water",
    {
        width: tileSize,
        height: tileSize,
        subdivisions: textureSize
    },
    scene
);
water.material = waterMaterial;
water.position.y = -1;

const oceanPlanetMaterial = new OceanPlanetMaterial("oceanPlanet", initialSpectrum, scene, engine);
const planetRadius = tileSize / 2;
const planet = new Planet(planetRadius, oceanPlanetMaterial, scene, engine);
planet.transform.position.y = planetRadius + 1;

camera.setTarget(planet.transform.getAbsolutePosition());

const skybox = MeshBuilder.CreateBox("skyBox", { size: camera.maxZ / 2 }, scene);
const skyboxMaterial = new StandardMaterial("skyBox", scene);
skyboxMaterial.backFaceCulling = false;
skyboxMaterial.reflectionTexture = waterMaterial.reflectionTexture;
skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
skyboxMaterial.disableLighting = true;
skybox.material = skyboxMaterial;

function updateScene() {
    const deltaSeconds = engine.getDeltaTime() / 1000;
    waterMaterial.update(deltaSeconds, light.direction);
    oceanPlanetMaterial.update(deltaSeconds, planet.transform, light.direction);
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
